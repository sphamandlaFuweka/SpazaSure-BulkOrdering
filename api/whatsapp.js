const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
    // 1. Twilio sends a POST request.
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const supabase = createClient(
            process.env.SUPABASE_URL, 
            process.env.SUPABASE_ANON_KEY
        );

        // 2. Parse Twilio data (Note: Vercel might need a body parser if this is empty)
        // Twilio sends data in the format: whatsapp:+2776...
        const fromNumber = req.body.From ? req.body.From.replace('whatsapp:', '') : '';

        const { data: profile } = await supabase
            .from('profiles')
            .select('store_name')
            .eq('whatsapp_number', fromNumber)
            .single();

        let message = "";
        const baseUrl = `https://${req.headers.host}`;

        if (profile) {
            message = `Welcome back to *SpazaSure*, ${profile.store_name}! 🏪\n\nTap to enter the market: ${baseUrl}/index.html?phone=${fromNumber}`;
        } else {
            message = `Welcome to *SpazaSure*! 🚀\n\nPlease register your store to start: ${baseUrl}/register.html?phone=${fromNumber}`;
        }

        // 3. Return TwiML (XML) to Twilio
        res.setHeader('Content-Type', 'text/xml');
        return res.status(200).send(`
            <Response>
                <Message>${message}</Message>
            </Response>
        `);

    } catch (err) {
        console.error("Bot Error:", err);
        res.setHeader('Content-Type', 'text/xml');
        return res.status(200).send('<Response><Message>System busy. Try again.</Message></Response>');
    }
}