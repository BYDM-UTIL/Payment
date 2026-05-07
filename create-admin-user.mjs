#!/usr/bin/env node
/**
 * Create admin user in Firebase - Instructions
 */

const projectId = 'payment-bydm-2026';

console.log(`
To create the admin user, you have two options:

OPTION 1: Firebase Console (easiest)
====================================
1. Open: https://console.firebase.google.com/project/${projectId}/authentication/users
2. Click: Add User
3. Enter:
   Email: admin@payment.com
   Password: Admin123!@#
4. Click: Create User

OPTION 2: Firebase CLI with service account
=============================================
# First, download service account key from Firebase Console
# Then set environment variable and run this script

OPTION 3: Use these temporary credentials
===========================================
Once the user is created, you can login at:
https://payment-bydm-2026.firebaseapp.com/

Credentials:
Email: admin@payment.com
Password: Admin123!@#
`);
