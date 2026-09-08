# Backend

Which APIs will be created, which parameters will be required/API documentaition.
Then working on Super Admin, Institue Admin, Campus Admin
Submit form api

## Submit Form API

Saving User Data that will be given at the landing page.
That's just a query that we will save in the db.

Pseudo Code:
req.body = full_name, institute_name, institute_type, email, phone, message
POST api/v1/inquiries

## Swagger for API Documentation

It's getting difficult for me to manually create api documentation for me, so I would use Swagger for it.

# What more APIs we have to create:

1. User Authentication but we have a confusion on that because "All roles arent suppose to register"
2. Super Admin can activate or deactivate any user account
> Created User APIs