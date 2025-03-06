# health-plan-API

# Demo:

**Positive Scenarios**

- `POST` request with localhost:3000/v1/plan/ with the JSON payload. Returns `201` with the `ETag` in the header in the response

```json
{
  "_org": "example.com",
  "creationDate": "12-12-2017",
  "linkedPlanServices": [
    {
      "_org": "example.com",
      "linkedService": {
        "_org": "example.com",
        "name": "Yearly physical",
        "objectId": "1234520xvc30asdf-502",
        "objectType": "service"
      },
      "objectId": "27283xvx9asdff-504",
      "objectType": "planservice",
      "planserviceCostShares": {
        "_org": "example.com",
        "copay": 0,
        "deductible": 10,
        "objectId": "1234512xvc1314asdfs-503",
        "objectType": "membercostshare"
      }
    },
    {
      "_org": "example.com",
      "linkedService": {
        "_org": "example.com",
        "name": "well baby",
        "objectId": "1234520xvc30sfs-505",
        "objectType": "service"
      },
      "objectId": "27283xvx9sdf-507",
      "objectType": "planservice",
      "planserviceCostShares": {
        "_org": "example.com",
        "copay": 175,
        "deductible": 10,
        "objectId": "1234512xvc1314sdfsd-506",
        "objectType": "membercostshare"
      }
    }
  ],
  "objectId": "12xvxc345ssdsds-508",
  "objectType": "plan",
  "planCostShares": {
    "_org": "example.com",
    "copay": 23,
    "deductible": 2000,
    "objectId": "1234vxc2324sdf-501",
    "objectType": "membercostshare"
  },
  "planType": "inNetwork"
}
```

- `GET` request with localhost:3000/v1/plan/1234vxc2324sdf-501 with the header `If-None-Match: ce0482a9a2aab5133a68d4f26ca2d042`. The header value is the ETag value taken from POST response. Returns `304`
- Same `GET` request again without `If-None-Match` header or with incorrect value in it. Returns `200` with the appropriate value of the objectId in the URL
- `DELETE` request with localhost:3000/v1/plan/1234vxc2324sdf-501. Returns `204` for success
- `PATCH` request with localhost:3000/v1/plan/1234vxc2324sdf-501. Returns `200` with the updated `ETag` for success. The payload for it would be

```json
{
  "linkedPlanServices": [
    {
      "linkedService": {
        "_org": "example.com",
        "objectId": "1234520xvc30sfs-505",
        "objectType": "service",
        "name": "well baby"
      },
      "planserviceCostShares": {
        "deductible": 10,
        "_org": "example.com",
        "copay": 175,
        "objectId": "1234512xvc1314sdfsd-506",
        "objectType": "membercostshare"
      },
      "_org": "example.com",
      "objectId": "27283xvx9sdf-507aaaa",
      "objectType": "planservice"
    }
  ],
  "objectId": "12xvxc345ssdsds-508"
}
```

**Negative Scenarios**

- POST -> `400` for non-json type payload or invalid json, `415` for wrong payload type
- GET -> `404` for object not present in database
- DELETE -> `404` for object not present in the database to delete
- PATCH -> `400` for non-json type payload or invalid json, `404` for object not present, `412` for not trying to update the latest resource, `415` for wrong payload type

**Tech Stack**

- Node + Express
- Redis

**To Setup local environment: (Mac OS)**

1. brew services start redis
2. `redis-cli` to connect to the running local redis server
3. `keys *` to view all the keys and `get <key>` to see their values

**OAuth 2.0 setup - Google Auth with Postman:**

Setup Reference: https://blog.postman.com/how-to-access-google-apis-using-oauth-in-postman/

1. Setup an OAuth 2.0 client in your google cloud project
2. Redirect URI: https://oauth.pstmn.io/v1/callback
3. After creation, you can see your client ID and secret, you have to later provide it in the Postman
4. In your Postman, for the Authorization setup, choose OAuth 2.0 and setup,
   1. Callback URL - https://oauth.pstmn.io/v1/callback
   2. Auth URL - https://accounts.google.com/o/oauth2/v2/auth (since its google auth)
   3. Access token URL - https://oauth2.googleapis.com/token
   4. Client Id and secret, you can get from your google auth client, which you had setup
   5. Scope - openid email profile
   6. Initially, you would need to sign in, after it, you will receive the auth code, click `Get New Access Token`. Choose `Use Token` and change the token type to `ID Token` in the Postman Authorization settings page.
   7. Repeat step 7, whenever you need a new token or if your token expires
