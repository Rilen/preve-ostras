import os
import google.oauth2.credentials
from firebase_admin import initialize_app, firestore, credentials

os.environ['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080'

class MockCred(credentials.Base):
    def __init__(self):
        self.project_id = 'preve-ostras'
    def get_credential(self):
        return google.oauth2.credentials.Credentials('mock_token')

try:    
    initialize_app(MockCred(), {'projectId': 'preve-ostras'})
    db = firestore.client()
    print('success')
except Exception as e:
    import traceback
    traceback.print_exc()
