import pandas as pd
import numpy as np
from app import app, db, PlayerStats

def import_data():
    try:
        # Read CSV file with latin1 encoding
        df = pd.read_csv('Player_Stats.csv', encoding='latin1')
        
        # Replace NaN values with appropriate defaults
        df = df.fillna({
            'Nation': 'Unknown',
            'Pos': 'Unknown',
            'Squad': 'Unknown',
            'Born': 0
        })
        # Replace remaining NaN values with 0 for numeric columns
        df = df.fillna(0)
        
        print(f"Read {len(df)} rows from CSV")
        
        # Clear existing data
        PlayerStats.query.delete()
        db.session.commit()
        print("Cleared existing data")
        
        # Import new data
        for index, row in df.iterrows():
            player = PlayerStats(
                Player=row['Player'],
                Nation=row['Nation'],
                Pos=row['Pos'],
                Squad=row['Squad'],
                Age=row['Age'],
                Born=row['Born'],
                MP=row['MP'],
                Starts=row['Starts'],
                Min=row['Min'],
                Goals=row['Goals'],
                Assists=row['Assists'],
                PK=row['PKatt'],
                PKatt=row['PKatt'],
                Shots=row['Shots'],
                SoT=row['SoT'],
                SoT_percent=row['SoT%'],
                G_per_Sh=row['G/Sh'],
                G_per_SoT=row['G/SoT'],
                ShoDist=row['ShoDist'],
                PasTotCmp=row['PasTotCmp'],
                PasTotAtt=row['PasTotAtt'],
                PasTotCmp_percent=row['PasTotCmp%'],
                PasTotDist=row['PasTotDist'],
                PasProgDist=row['PasTotPrgDist'],
                Tkl=row['Tkl'],
                TklW=row['TklWon'],
                Int=row['Int'],
                Blocks=row['Blocks']
            )
            db.session.add(player)
            
        db.session.commit()
        print("Data imported successfully")
        
        # Verify the import
        total_players = PlayerStats.query.count()
        print(f"Total players in database: {total_players}")
        
    except Exception as e:
        print(f"Error importing data: {e}")
        db.session.rollback()
    finally:
        print("Database connection closed")

def main():
    with app.app_context():
        # Create tables
        db.create_all()
        print("Table created successfully")
        
        # Import data
        import_data()

if __name__ == '__main__':
    main() 