from app import app, db
from models import Admin

def create_admin():
    with app.app_context():
        # Check if admin already exists
        existing_admin = Admin.query.filter_by(username='admin').first()
        if existing_admin:
            print('Admin user already exists')
            return

        # Create new admin user
        admin = Admin(
            username='admin',
            email='admin@spas.com'
        )
        admin.set_password('admin123')
        
        try:
            db.session.add(admin)
            db.session.commit()
            print('Admin user created successfully')
        except Exception as e:
            print(f'Error creating admin user: {str(e)}')
            db.session.rollback()

if __name__ == '__main__':
    create_admin() 