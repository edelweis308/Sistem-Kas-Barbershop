const supabaseUrl =
    "https://ibtellsghilhhaykfmqd.supabase.co";


const supabaseKey =
    "sb_publishable_yGeY1P8fOyPFqAx8PSIFXA_INhoDXNy";


window.supabaseClient =
    window.supabase.createClient(
        supabaseUrl,
        supabaseKey
    );