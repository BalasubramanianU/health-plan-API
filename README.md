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

**Negative Scenarios**

- POST -> `400` for non-json type payload or invalid json, `415` for wrong payload type
- GET -> `404` for object not present in database
- DELETE -> `404` for object not present in the database to delete

Tech Stack

- Node + Express
- Redis

To Setup local environment: (Mac OS)

1. brew services start redis
2. `redis-cli` to connect to the running local redis server
3. `keys *` to view all the keys and `get <key>` to see their values
