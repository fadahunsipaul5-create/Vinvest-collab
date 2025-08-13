# Signals removed - not needed since we store all user data directly in the User model
# The previous signals were trying to create additional User objects which caused
# database errors when registering new users.
