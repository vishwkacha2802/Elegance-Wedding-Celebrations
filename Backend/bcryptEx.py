import bcrypt


# Hash a plain-text password before saving it to the database.

def hash_password(password: str):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt())


# Compare a plain-text password against the stored bcrypt hash.

def verify_password(password: str, hashed_password: bytes):
    return bcrypt.checkpw(password.encode(), hashed_password)
