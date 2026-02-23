const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
    // 1. Twilio sends a POST request. We ignore everything else.
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        // 2. Initialize Supabase using your Environment Variables
        const supabase = createClient(
            process.env.SUPABASE_URL, 
            process.env.SUPABASE_ANON_KEY
        );

        // 3. Extract the phone number from the Twilio request body
        // Twilio sends data as 'whatsapp:+2776...'
        const fromNumber = req.body.From ? req.body.From.replace('whatsapp:', '') : '';

        // 4. Check if this number exists in your profiles table
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('store_name')
            .eq('whatsapp_number', fromNumber)
            .single();

        let message = "";
        const host = req.headers.host; // This gets your vercel URL automatically

        if (profile) {
            // Existing User
            message = `Welcome back to *SpazaSure*, ${profile.store_name}! 🏪\n\nTap the link below to enter the market and order:\n\nhttps://${host}/index.html?phone=${fromNumber}`;
        } else {
            // New User
            message = `Welcome to *SpazaSure*! 🚀\n\nI don't see your store registered yet. Tap below to create your profile:\n\nhttps://${host}/register.html?phone=${fromNumber}`;
        }

        // 5. Send back TwiML (XML) so Twilio knows what to text the user
        res.setHeader('Content-Type', 'text/xml');
        return res.status(200).send(`
            <Response>
                <Message>${message}</Message>
            </Response>
        `);

    } catch (err) {
        console.error("Internal Error:", err);
        res.setHeader('Content-Type', 'text/xml');
        return res.status(200).send('<Response><Message>SpazaSure is busy. Please try again in a moment.</Message></Response>');
    }
}