async function run() {
  const url = 'https://cavbavqglivytnpesage.supabase.co/functions/v1/crisis-alert';

  console.log('--- Triggering Crisis Alert via Terminal ---');
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      // Note: No Authorization header needed because we deployed with --no-verify-jwt
    },
    body: JSON.stringify({
      contactName: 'Emergency Contact (Test)',
      contactPhone: '+918019718561',  // Make sure this is verified in Twilio!
      contactEmail: 'rishikeshgurrala07@gmail.com',
      userName: 'Terminal Test User',
      message: 'This is a test crisis alert sent directly from the terminal without using the UI or Groq.'
    })
  });

  const text = await response.text();
  console.log('\nResponse Status:', response.status);
  console.log('Response Body:', text);
}

run().catch(console.error);
