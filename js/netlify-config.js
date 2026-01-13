// netlify-config.js - Para Netlify
(function() {
    // Esta función se ejecuta automáticamente
    console.log('Configurando variables para Netlify...');
    
    // Variables que Netlify inyecta (las configuramos en el Paso 3)
    window.SUPABASE_URL = 'https://tzbqiqjsugidkzdwgvof.supabase.co';
    window.SUPABASE_ANON_KEY = 'TU_CLAVE_ANON_KEY_AQUI';
    
    // Verificar que se cargaron
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
        console.error('❌ ERROR: Variables de Supabase no configuradas');
        console.log('📝 Ve a Netlify → Site settings → Environment variables');
        console.log('📝 Agrega: SUPABASE_URL y SUPABASE_ANON_KEY');
    } else {
        console.log('✅ Variables configuradas correctamente');
    }
})();