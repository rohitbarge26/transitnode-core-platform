# TransitNode ERP Backend

## Environment Configuration

This backend requires several critical environment variables to function correctly. 
To get started, copy the provided example configuration file:

```bash
cp .env.example .env
```

### JWT Security Configuration

We enforce strict cryptographic security for all JSON Web Tokens (JWT). The system will **fail to start** if a valid `JWT_SECRET` is not provided in your `.env` file.

**Do NOT use weak or guessable secrets (e.g., "secret123").**

To generate a cryptographically strong, 256-bit random hex string locally, execute the following quick terminal command:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output of that command and paste it into your `.env` file:
```env
JWT_SECRET=your_generated_hex_string_here
```
