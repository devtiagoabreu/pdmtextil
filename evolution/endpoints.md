# Evolution API v2.3.7 Documentation

> API REST completa para WhatsApp com suporte multi-provedor (Baileys + Meta Cloud API)
https://www.postman.com/agenciadgcode/evolution-api/request/blfa16k/find-contacts?tab=overview&sideView=agentMode

## Info

- **Version:** 2.3.7
- **Base URL:** `http://localhost:8080` (local) or `https://api.evolution-api.com` (production)
- **Auth:** `apikey` header (global or instance-specific)

## Instance Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/instance/create` | Create a new WhatsApp instance |
| GET | `/instance/connect/{instanceName}` | Connect instance to WhatsApp (returns QR code) |
| GET | `/instance/connectionState/{instanceName}` | Get current connection state (open/close/connecting) |
| GET | `/instance/fetchInstances` | List all instances |
| POST | `/instance/restart/{instanceName}` | Restart an instance |
| DELETE | `/instance/logout/{instanceName}` | Logout and disconnect instance |
| DELETE | `/instance/delete/{instanceName}` | Delete an instance |
| POST | `/instance/setPresence/{instanceName}` | Set presence (available/unavailable/composing/recording) |

### POST /instance/create

```json
{
  "instanceName": "my-instance",
  "integration": "WHATSAPP-BAILEYS",
  "qrcode": true,
  "token": "",
  "number": "",
  "webhook": {
    "enabled": true,
    "url": "https://webhook.example.com",
    "events": ["MESSAGES_UPSERT", "CONNECTION_UPDATE"]
  }
}
```

## Message Sending

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/message/sendText/{instanceName}` | Send a text message |
| POST | `/message/sendMedia/{instanceName}` | Send media (image/video/audio/document) |
| POST | `/message/sendButtons/{instanceName}` | Send interactive buttons |
| POST | `/message/sendList/{instanceName}` | Send interactive list |
| POST | `/message/sendLocation/{instanceName}` | Send location |
| POST | `/message/sendContact/{instanceName}` | Send contact card |
| POST | `/message/sendPoll/{instanceName}` | Send poll |
| POST | `/message/sendReaction/{instanceName}` | Send emoji reaction |
| POST | `/message/sendTemplate/{instanceName}` | Send WhatsApp Business template |

### POST /message/sendText/{instanceName}

```json
{
  "number": "5511999999999",
  "textMessage": { "text": "Hello World" },
  "delay": 1000,
  "linkPreview": true,
  "mentioned": ["5511999999999@c.us"]
}
```

### POST /message/sendMedia/{instanceName}

Multipart/form-data:

| Field | Type | Description |
|-------|------|-------------|
| number | string | Phone number with country code |
| mediatype | string | `image`, `video`, `audio`, or `document` |
| media | binary | Media file |
| caption | string | Optional caption |
| fileName | string | Optional filename |

### POST /message/sendButtons/{instanceName}

```json
{
  "number": "5511999999999",
  "text": "Choose:",
  "footerText": "Footer",
  "buttons": [
    { "buttonId": "1", "buttonText": { "text": "Yes" } },
    { "buttonId": "2", "buttonText": { "text": "No" } }
  ]
}
```

### POST /message/sendList/{instanceName}

```json
{
  "number": "5511999999999",
  "title": "Menu",
  "description": "Choose an option",
  "buttonText": "View options",
  "sections": [
    { "title": "Section 1", "rows": [{ "title": "Option 1", "rowId": "1" }] }
  ]
}
```

## Chat & Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/archiveChat/{instanceName}` | Archive or unarchive a chat |
| POST | `/chat/findChats/{instanceName}` | Search/filter chats |
| POST | `/chat/findContacts/{instanceName}` | Search/filter contacts |
| POST | `/chat/findMessages/{instanceName}` | Search/filter messages |
| POST | `/chat/markMessageAsRead/{instanceName}` | Mark message as read |
| POST | `/chat/whatsappNumbers/{instanceName}` | Check if numbers exist on WhatsApp |
| POST | `/chat/updateProfileName/{instanceName}` | Update profile name |
| POST | `/chat/updateProfileStatus/{instanceName}` | Update profile status |
| POST | `/chat/updateProfilePicture/{instanceName}` | Update profile picture (multipart) |

### POST /chat/whatsappNumbers/{instanceName}

```json
{
  "numbers": ["5511999999999", "5511888888888"]
}
```

### POST /chat/findMessages/{instanceName}

Supports `where`, `take`, `skip`, `orderBy` query params.

## Groups

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/group/create/{instanceName}` | Create a group |
| GET | `/group/findGroupInfos/{instanceName}` | Get group info |
| GET | `/group/participants/{instanceName}` | Get participants |
| POST | `/group/updateParticipant/{instanceName}` | Add/remove/promote/demote participants |

### POST /group/create/{instanceName}

```json
{
  "subject": "My Group",
  "participants": ["5511999999999", "5511888888888"],
  "description": "Group description"
}
```

### POST /group/updateParticipant/{instanceName}

```json
{
  "groupJid": "120363123456789012@g.us",
  "action": "add",
  "participants": ["5511999999999@c.us"]
}
```

Actions: `add`, `remove`, `promote`, `demote`

## Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settings/find/{instanceName}` | Get instance settings |
| POST | `/settings/set/{instanceName}` | Configure settings |

### Settings payload

```json
{
  "rejectCall": false,
  "msgCall": "",
  "groupsIgnore": false,
  "alwaysOnline": false,
  "readMessages": true,
  "readStatus": false,
  "syncFullHistory": false
}
```

## Webhook Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/webhook/find/{instanceName}` | Find active webhook config |
| POST | `/webhook/instance` | Set webhook for instance |

### POST /webhook/instance

```json
{
  "url": "https://webhook.example.com",
  "webhook_by_events": false,
  "webhook_base64": false,
  "events": [
    "QRCODE_UPDATED",
    "MESSAGES_UPSERT",
    "MESSAGES_UPDATE",
    "MESSAGES_DELETE",
    "SEND_MESSAGE",
    "CONNECTION_UPDATE",
    "TYPEBOT_START",
    "TYPEBOT_CHANGE_STATUS"
  ]
}
```

### Supported Webhook Events

| Event | Description |
|-------|-------------|
| APPLICATION_STARTUP | App startup notification |
| QRCODE_UPDATED | QR code base64 for scanning |
| CONNECTION_UPDATE | Connection status change |
| MESSAGES_SET | Initial messages load (once) |
| MESSAGES_UPSERT | New message received |
| MESSAGES_UPDATE | Message updated |
| MESSAGES_DELETE | Message deleted |
| SEND_MESSAGE | Message sent |
| CONTACTS_SET | Initial contacts load (once) |
| CONTACTS_UPSERT | Contacts reload (once) |
| CONTACTS_UPDATE | Contact updated |
| PRESENCE_UPDATE | User online/typing/recording |
| CHATS_SET | Initial chats load |
| CHATS_UPDATE | Chat updated |
| CHATS_UPSERT | New chat info |
| CHATS_DELETE | Chat deleted |
| GROUPS_UPSERT | Group created |
| GROUPS_UPDATE | Group updated |
| GROUP_PARTICIPANTS_UPDATE | Participant add/remove/promote/demote |
| NEW_TOKEN | JWT token updated |

## Key Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| SERVER_TYPE | http or https | http |
| SERVER_PORT | Server port | 8080 |
| DATABASE_ENABLED | Enable persistent storage | true |
| DATABASE_PROVIDER | postgresql or mysql | postgresql |
| DATABASE_CONNECTION_URI | DB connection URI | - |
| CACHE_REDIS_ENABLED | Enable Redis cache | true |
| CACHE_REDIS_URI | Redis URI | redis://localhost:6379/6 |
| AUTHENTICATION_API_KEY | Global API key | - |
| WEBHOOK_GLOBAL_URL | Global webhook URL | - |
| S3_ENABLED | Enable S3 storage | false |

## Error Response Format

All endpoints return standard error responses:

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request parameters"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/instance/connect/my-instance",
    "method": "GET"
  }
}
```

Error codes: `BAD_REQUEST` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `INTERNAL_SERVER_ERROR` (500)
