// Seed Firebase with test user and initial data
import admin from 'firebase-admin';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp, serverTimestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin with service account
// This assumes firebase CLI is authenticated
const auth = getAuth();
const db = getFirestore();

const seedData = {
  // Test admin user
  user: {
    email: 'admin@payment.com',
    password: 'Admin123!@#',
    displayName: 'Admin User'
  },
  // Employer data
  employer: {
    name: 'בדיקה מעסיק',
    phone: '+972501234567',
    email: 'employer@payment.com',
    address: 'תל אביב'
  },
  // Employee data
  employee: {
    fullName: 'עובד חוץ',
    startDate: Timestamp.fromDate(new Date('2026-01-01')),
    baseSalary: 5632,
    shabbatRate: 1.5,
    vacationDaysPerYear: 10,
    holidayRate: 1.5,
    partialDayRate: 80,
    pensionPercentage: 12.5,
    recuperationDaysPerYear: 7,
    recuperationRate: 100,
    active: true,
    notes: 'עובדת זרה - בדיקה'
  }
};

async function seedFirebase() {
  console.log('Starting Firebase seed...');

  try {
    // 1. Create test admin user
    console.log('Creating admin user...');
    const userRecord = await auth.createUser({
      email: seedData.user.email,
      password: seedData.user.password,
      displayName: seedData.user.displayName
    });
    console.log(`✓ User created: ${userRecord.uid}`);
    const userId = userRecord.uid;

    // 2. Set custom claims (admin role)
    await auth.setCustomUserClaims(userId, { role: 'admin' });
    console.log('✓ Admin role assigned');

    // 3. Create user profile in Firestore
    console.log('Creating user profile...');
    await db.collection('users').doc(userId).set({
      uid: userId,
      email: seedData.user.email,
      displayName: seedData.user.displayName,
      role: 'admin',
      language: 'he',
      createdAt: serverTimestamp()
    });
    console.log('✓ User profile created');

    // 4. Create employer
    console.log('Creating employer...');
    const employerRef = await db.collection('employers').add({
      name: seedData.employer.name,
      phone: seedData.employer.phone,
      email: seedData.employer.email,
      address: seedData.employer.address,
      createdBy: userId,
      createdAt: serverTimestamp()
    });
    const employerId = employerRef.id;
    console.log(`✓ Employer created: ${employerId}`);

    // 5. Create employee
    console.log('Creating employee...');
    const employeeRef = await db.collection('employees').add({
      employerId: employerId,
      fullName: seedData.employee.fullName,
      startDate: seedData.employee.startDate,
      baseSalary: seedData.employee.baseSalary,
      shabbatRate: seedData.employee.shabbatRate,
      vacationDaysPerYear: seedData.employee.vacationDaysPerYear,
      holidayRate: seedData.employee.holidayRate,
      partialDayRate: seedData.employee.partialDayRate,
      pensionPercentage: seedData.employee.pensionPercentage,
      recuperationDaysPerYear: seedData.employee.recuperationDaysPerYear,
      recuperationRate: seedData.employee.recuperationRate,
      active: seedData.employee.active,
      notes: seedData.employee.notes,
      createdAt: serverTimestamp()
    });
    const employeeId = employeeRef.id;
    console.log(`✓ Employee created: ${employeeId}`);

    // 6. Create 2026 year settings
    console.log('Creating year settings for 2026...');
    await db.collection('employees').doc(employeeId).collection('years').doc('2026').set({
      year: 2026,
      baseSalary: seedData.employee.baseSalary,
      pensionPercentage: seedData.employee.pensionPercentage,
      createdAt: serverTimestamp()
    });
    console.log('✓ Year settings created');

    // 7. Seed monthly payments for Jan-Apr 2026
    console.log('Seeding monthly payments...');
    const paymentsData = [
      {
        month: 1,
        baseSalary: 5632,
        pocketMoney: 400,
        shabbat: 1704,
        vacation: 0,
        holiday: 0,
        partialDay: 0,
        paid: { cash: 320, payslip: 2157, bankTransfer: 5259 },
        signature: 'signed',
        status: 'paid'
      },
      {
        month: 2,
        baseSalary: 5632,
        pocketMoney: 400,
        shabbat: 1704,
        vacation: 0,
        holiday: 426,
        partialDay: 0,
        paid: { cash: 2786, payslip: 2157, bankTransfer: 3987 },
        signature: 'signed',
        status: 'paid'
      },
      {
        month: 3,
        baseSalary: 5632,
        pocketMoney: 400,
        shabbat: 1704,
        vacation: 0,
        holiday: 0,
        partialDay: 0,
        paid: { cash: 2050, payslip: 3620, bankTransfer: 3260 },
        signature: 'signed',
        status: 'paid'
      },
      {
        month: 4,
        baseSalary: 5632,
        pocketMoney: 400,
        shabbat: 1704,
        vacation: 0,
        holiday: 0,
        partialDay: 0,
        paid: { cash: 200, payslip: 0, bankTransfer: 8730 },
        signature: 'signed',
        status: 'paid'
      }
    ];

    for (const payment of paymentsData) {
      await db
        .collection('employees')
        .doc(employeeId)
        .collection('years')
        .doc('2026')
        .collection('monthlyPayments')
        .doc(String(payment.month).padStart(2, '0'))
        .set({
          ...payment,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
    }
    console.log('✓ Monthly payments seeded');

    // 8. Seed pension payments
    console.log('Seeding pension payments...');
    const pensionData = [
      { month: 1, amount: 704, paid: 704 },
      { month: 2, amount: 704, paid: 704 },
      { month: 3, amount: 704, paid: 704 },
      { month: 4, amount: 704, paid: 704 },
      { month: 5, amount: 704, paid: 0 },
      { month: 6, amount: 704, paid: 0 },
      { month: 7, amount: 704, paid: 0 }
    ];

    for (const pension of pensionData) {
      await db
        .collection('employees')
        .doc(employeeId)
        .collection('years')
        .doc('2026')
        .collection('pensionPayments')
        .doc(String(pension.month).padStart(2, '0'))
        .set({
          ...pension,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
    }
    console.log('✓ Pension payments seeded');

    console.log('\n✅ Firebase seed completed successfully!\n');
    console.log('Login credentials:');
    console.log(`  Email: ${seedData.user.email}`);
    console.log(`  Password: ${seedData.user.password}`);
    console.log(`\nYou can now login at: https://payment-bydm-2026.firebaseapp.com/`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding Firebase:', error);
    process.exit(1);
  }
}

seedFirebase();
