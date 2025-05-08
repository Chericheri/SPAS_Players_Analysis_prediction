from flask import Flask, jsonify, request, session, redirect, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import pandas as pd
import os
import numpy as np
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:@localhost/spas_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Change this to a secure secret key
CORS(app)

# Initialize database
db = SQLAlchemy()
db.init_app(app)

# Admin model
class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Player model
class PlayerStats(db.Model):
    __tablename__ = 'player_stats'
    
    id = db.Column(db.Integer, primary_key=True)
    Player = db.Column(db.String(255))
    Nation = db.Column(db.String(100))
    Pos = db.Column(db.String(50))
    Squad = db.Column(db.String(255))
    Age = db.Column(db.Integer)
    Born = db.Column(db.Integer)
    MP = db.Column(db.Integer)
    Starts = db.Column(db.Integer)
    Min = db.Column(db.Integer)
    Goals = db.Column(db.Integer)
    Assists = db.Column(db.Integer)
    PK = db.Column(db.Integer)
    PKatt = db.Column(db.Integer)
    Shots = db.Column(db.Integer)
    SoT = db.Column(db.Integer)
    SoT_percent = db.Column(db.Float)
    G_per_Sh = db.Column(db.Float)
    G_per_SoT = db.Column(db.Float)
    ShoDist = db.Column(db.Float)
    PasTotCmp = db.Column(db.Integer)
    PasTotAtt = db.Column(db.Integer)
    PasTotCmp_percent = db.Column(db.Float)
    PasTotDist = db.Column(db.Float)
    PasProgDist = db.Column(db.Float)
    Tkl = db.Column(db.Integer)
    TklW = db.Column(db.Integer)
    Int = db.Column(db.Integer)
    Blocks = db.Column(db.Integer)
    created_at = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())

# Decorator for admin-only routes
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_id' not in session:
            return jsonify({'error': 'Admin login required'}), 401
        return f(*args, **kwargs)
    return decorated_function

# Route to serve frontend
@app.route('/')
def serve_landing_page():
    return send_from_directory(app.static_folder, 'Landing_page.html')

# API Routes
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    admin = Admin.query.filter_by(username=data['username']).first()
    
    if admin and admin.check_password(data['password']):
        session['admin_id'] = admin.id
        return jsonify({'message': 'Login successful', 'admin': admin.username})
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    session.pop('admin_id', None)
    return jsonify({'message': 'Logout successful'})

@app.route('/api/admin/check', methods=['GET'])
def check_admin():
    if 'admin_id' in session:
        admin = Admin.query.get(session['admin_id'])
        return jsonify({'is_admin': True, 'username': admin.username})
    return jsonify({'is_admin': False})

@app.route('/api/admin/players', methods=['POST'])
@admin_required
def add_player():
    data = request.get_json()
    new_player = PlayerStats(
        Player=data['Player'],
        Nation=data['Nation'],
        Pos=data['Pos'],
        Squad=data['Squad'],
        Age=data['Age'],
        MP=data['MP'],
        Goals=data['Goals'],
        Assists=data['Assists'],
        PasTotCmp=data['PasTotCmp'],
        Shots=data['Shots'],
        SoT=data['SoT']
    )
    db.session.add(new_player)
    db.session.commit()
    return jsonify({'message': 'Player added successfully'})

@app.route('/api/admin/players/<player_name>', methods=['DELETE'])
@admin_required
def delete_player(player_name):
    player = PlayerStats.query.filter_by(Player=player_name).first()
    if player:
        db.session.delete(player)
        db.session.commit()
        return jsonify({'message': 'Player deleted successfully'})
    return jsonify({'error': 'Player not found'}), 404

@app.route('/api/stats/overview', methods=['GET'])
def get_overview_stats():
    try:
        # Get all players from database
        players = PlayerStats.query.all()
        
        # Convert to list of dictionaries for easier processing
        player_data = [{
            'Player': p.Player,
            'Pos': p.Pos,
            'Squad': p.Squad,
            'Age': p.Age,
            'Goals': p.Goals,
            'Assists': p.Assists,
            'MP': p.MP,
            'PasTotCmp_percent': p.PasTotCmp_percent,
            'SoT': p.SoT,
            'Shots': p.Shots
        } for p in players]
        
        df = pd.DataFrame(player_data)
        
        # Calculate age distribution
        age_bins = [18, 21, 24, 27, 30, 100]
        age_labels = ['18-20', '21-23', '24-26', '27-29', '30+']
        age_distribution = pd.cut(df['Age'], bins=age_bins, labels=age_labels).value_counts().to_dict()
        
        # Calculate position distribution
        position_distribution = df['Pos'].value_counts().to_dict()
        
        # Calculate goals vs assists correlation
        goals_assists = df[['Goals', 'Assists']].dropna().to_dict('records')
        
        # Calculate accuracy by position
        accuracy_by_position = df.groupby('Pos')['PasTotCmp_percent'].mean().to_dict()
        
        # Calculate total teams
        total_teams = df['Squad'].nunique()
        
        # Calculate total matches
        total_matches = df['MP'].sum()
        
        response_data = {
            'age_distribution': age_distribution,
            'position_distribution': position_distribution,
            'goals_assists': goals_assists,
            'accuracy_by_position': accuracy_by_position,
            'total_teams': int(total_teams),
            'total_matches': int(total_matches)
        }
        
        print("Successfully processed overview stats")
        return jsonify(response_data)
    except Exception as e:
        print(f"Error in get_overview_stats: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats/player/<player_name>', methods=['GET'])
def get_player_stats(player_name):
    try:
        player = PlayerStats.query.filter(PlayerStats.Player.like(f"%{player_name}%")).first()
        if not player:
            return jsonify({'error': 'Player not found'}), 404
        
        return jsonify({
            'Player': player.Player,
            'Pos': player.Pos,
            'Squad': player.Squad,
            'Age': player.Age,
            'Goals': player.Goals,
            'Assists': player.Assists,
            'MP': player.MP,
            'PasTotCmp%': player.PasTotCmp_percent,
            'SoT': player.SoT,
            'Shots': player.Shots
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats/teams', methods=['GET'])
def get_team_stats():
    try:
        teams = db.session.query(
            PlayerStats.Squad,
            db.func.sum(PlayerStats.Goals).label('total_goals'),
            db.func.sum(PlayerStats.Assists).label('total_assists'),
            db.func.avg(PlayerStats.MP).label('avg_matches'),
            db.func.avg(PlayerStats.PasTotCmp_percent).label('avg_pass_accuracy')
        ).group_by(PlayerStats.Squad).all()
        
        team_stats = [{
            'Squad': team[0],
            'Goals': float(team[1]),
            'Assists': float(team[2]),
            'MP': float(team[3]),
            'PasTotCmp%': float(team[4])
        } for team in teams]
        
        return jsonify(team_stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats/positions', methods=['GET'])
def get_position_stats():
    try:
        positions = db.session.query(
            PlayerStats.Pos,
            db.func.avg(PlayerStats.Goals).label('avg_goals'),
            db.func.avg(PlayerStats.Assists).label('avg_assists'),
            db.func.avg(PlayerStats.PasTotCmp_percent).label('avg_pass_accuracy'),
            db.func.avg(PlayerStats.Tkl).label('avg_tackles'),
            db.func.avg(PlayerStats.Int).label('avg_interceptions')
        ).group_by(PlayerStats.Pos).all()
        
        position_stats = [{
            'Pos': pos[0],
            'Goals': float(pos[1]),
            'Assists': float(pos[2]),
            'PasTotCmp%': float(pos[3]),
            'Tkl': float(pos[4]),
            'Int': float(pos[5])
        } for pos in positions]
        
        return jsonify(position_stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/players', methods=['GET'])
def get_players():
    try:
        players = PlayerStats.query.all()
        return jsonify([{
            'Player': player.Player,
            'Pos': player.Pos,
            'Squad': player.Squad,
            'Age': player.Age,
            'Goals': player.Goals,
            'Assists': player.Assists,
            'MP': player.MP,
            'PasTotCmp%': player.PasTotCmp_percent,
            'SoT': player.SoT,
            'Shots': player.Shots
        } for player in players])
    except Exception as e:
        print(f"Error in get_players: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/players/<int:player_id>', methods=['GET'])
def get_player(player_id):
    player = PlayerStats.query.get_or_404(player_id)
    return jsonify({
        'id': player.id,
        'name': player.Player,
        'position': player.Pos,
        'team': player.Squad,
        'goals': player.Goals,
        'assists': player.Assists,
        'matches_played': player.MP
    })

@app.route('/api/stats', methods=['GET'])
def get_stats():
    players = PlayerStats.query.all()
    total_goals = sum(player.Goals for player in players)
    total_assists = sum(player.Assists for player in players)
    return jsonify({
        'total_players': len(players),
        'total_goals': total_goals,
        'total_assists': total_assists
    })

@app.route('/api/import-csv', methods=['POST'])
def import_csv():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    try:
        df = pd.read_csv(file)
        for _, row in df.iterrows():
            player = PlayerStats(
                Player=row['Player'],
                Pos=row['Position'],
                Squad=row['Team'],
                Goals=row['Goals'],
                Assists=row['Assists'],
                MP=row['Matches Played']
            )
            db.session.add(player)
        db.session.commit()
        return jsonify({'message': 'Data imported successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 