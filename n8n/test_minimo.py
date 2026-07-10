import json

with open('D:\\Tiago\\dev\\pdmtextil\\n8n\\whatsapp-bot-ai-agent.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Test 1: Minimal workflow with just webhook + function + http
minimal = {
    "name": "TEST - Minimal",
    "nodes": [
        {
            "id": "w1",
            "name": "Webhook",
            "type": "n8n-nodes-base.webhook",
            "typeVersion": 2,
            "position": [200, 300],
            "webhookId": "test-webhook",
            "parameters": {
                "path": "test-path",
                "responseMode": "lastNode",
                "responseData": "allEntries",
                "options": {},
                "httpMethod": "POST"
            }
        },
        {
            "id": "f1",
            "name": "Function",
            "type": "n8n-nodes-base.function",
            "typeVersion": 1,
            "position": [400, 300],
            "parameters": {
                "functionCode": "return [{json: {test: true}}];"
            }
        }
    ],
    "connections": {
        "Webhook": {
            "main": [[{"node": "Function", "type": "main", "index": 0}]]
        }
    },
    "pinData": {},
    "versionId": "v1",
    "active": False,
    "settings": {
        "executionOrder": "v1",
        "timezone": "America/Sao_Paulo",
        "saveManualExecutions": True
    },
    "tags": [],
    "createdAt": "",
    "updatedAt": ""
}

with open('D:\\Tiago\\dev\\pdmtextil\\n8n\\test_minimo.json', 'w', encoding='utf-8') as f:
    json.dump(minimal, f, indent=2, ensure_ascii=False)

print("Minimal workflow created")
