import json

# read the generated JS key payload containing \r\n explicitly
with open('final_key.txt', 'r', encoding='utf-16le') as f:
    key_str = f.read().strip()

key = json.loads(key_str)

with open('main.py', 'r', encoding='utf-8') as f:
    main_content = f.read()

pre = main_content[:main_content.find('cred = credentials')]
post = main_content[main_content.find('options ='):]

new_cred = f"""cred = credentials.Certificate({{
    "type": "service_account",
    "project_id": "preve-ostras",
    "client_email": "test@test.com",
    "private_key": {repr(key)},
    "token_uri": "https://oauth2.googleapis.com/token"
}})
"""

with open('main.py', 'w', encoding='utf-8') as f:
    f.write(pre + new_cred + post)

print("Patcher executed.")
