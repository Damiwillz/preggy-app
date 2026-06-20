const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type ChatMessage = {
  role: 'user' | 'ai';
  text: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'Missing OPENAI_API_KEY secret.',
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const body = await req.json();
    const messages = (body.messages ?? []) as ChatMessage[];
    const pregnancyWeek = body.pregnancyWeek ?? null;
    const babyNickname = body.babyNickname ?? 'your baby';

    const conversation = messages
      .slice(-8)
      .map((message) => ({
        role: message.role === 'ai' ? 'assistant' : 'user',
        content: message.text,
      }));

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        input: [
          {
            role: 'system',
            content:
              `You are Preggy AI, a warm pregnancy support assistant inside a pregnancy tracking app. ` +
              `The user is currently around week ${pregnancyWeek ?? 'unknown'} of pregnancy and the baby nickname is ${babyNickname}. ` +
              `Give supportive, practical, easy to understand pregnancy wellness guidance. ` +
              `Do not diagnose, prescribe, or replace a clinician. ` +
              `For severe pain, bleeding, fever, reduced fetal movement, fainting, chest pain, shortness of breath, severe headache, vision changes, swelling of face or hands, or anything urgent, tell the user to contact their maternity care team or emergency services immediately. ` +
              `Keep answers concise and kind.`,
          },
          ...conversation,
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log('OpenAI error:', data);

      return new Response(
        JSON.stringify({
          error: data?.error?.message ?? 'OpenAI request failed.',
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const answer =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      'I am here with you. Could you tell me a little more about what you are feeling?';

    return new Response(
      JSON.stringify({
        answer,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.log('Preggy AI function error:', error);

    return new Response(
      JSON.stringify({
        error: 'Preggy AI could not respond right now.',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
