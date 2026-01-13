// Configuración de Supabase
const SUPABASE_URL = 'https://tzbqiqjsugidkzdwgvof.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6YnFpcWpzdWdpZGt6ZHdndm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMDEyNzAsImV4cCI6MjA4MzY3NzI3MH0.WlcyGQ7-ab9l_AGdfVfGuh-dxtOpVa08BccUTqKnbJQ';

// Variable para el cliente de Supabase
let supabaseClient = null;

// Función para inicializar Supabase
function initSupabase() {
    if (!window.supabase) {
        console.error('ERROR: La biblioteca de Supabase no está cargada.');
        console.error('Asegúrate de cargar: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
        return false;
    }
    
    if (!supabaseClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return true;
}

// Inicializar automáticamente al cargar
if (typeof window.supabase !== 'undefined') {
    initSupabase();
}

// Función para login de administrador
async function adminLogin(email, password) {
    if (!initSupabase()) {
        return {
            success: false,
            error: 'Error de configuración'
        };
    }

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error('Error en login:', error.message);
            throw new Error('Email o contraseña incorrectos');
        }

        return {
            success: true,
            user: data.user,
            session: data.session
        };

    } catch (error) {
        console.error('Error en adminLogin:', error);
        return {
            success: false,
            error: error.message || 'Error al iniciar sesión'
        };
    }
}

// Función para cerrar sesión
async function adminLogout() {
    if (!initSupabase()) {
        window.location.href = '/admin-login.html';
        return;
    }

    try {
        await supabaseClient.auth.signOut();
    } catch (error) {
        console.error('Error cerrando sesión:', error);
    }

    localStorage.removeItem('admin_session');
    window.location.href = '/admin-login.html';
}

// Verificar sesión al cargar la página
async function checkAdminSession() {
    if (!initSupabase()) {
        redirectToLogin();
        return null;
    }

    try {
        const { data, error } = await supabaseClient.auth.getSession();

        if (error || !data.session) {
            redirectToLogin();
            return null;
        }

        return data.session;
    } catch (error) {
        console.error('Error en checkAdminSession:', error);
        redirectToLogin();
        return null;
    }
}

// Función para obtener el usuario actual
async function getCurrentUser() {
    if (!initSupabase()) {
        return null;
    }

    try {
        const { data, error } = await supabaseClient.auth.getUser();

        if (error || !data.user) {
            return null;
        }

        return data.user;
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        return null;
    }
}

// Función para subir imágenes a Supabase Storage
async function uploadToStorage(bucketName, file, filePath) {
    if (!initSupabase()) {
        throw new Error('Supabase no inicializado');
    }

    try {
        const { data, error } = await supabaseClient.storage
            .from(bucketName)
            .upload(filePath, file);

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error subiendo a storage:', error);
        throw error;
    }
}

// Función para obtener URL pública
function getPublicUrl(bucketName, filePath) {
    if (!initSupabase()) {
        return null;
    }

    const { data } = supabaseClient.storage
        .from(bucketName)
        .getPublicUrl(filePath);

    return data.publicUrl;
}
// Función para crear la columna click_count si no existe
async function createClickCountColumn() {
    try {
        console.log('⚠️ La columna click_count no existe en la tabla products.');
        console.log('Por favor, ejecuta este SQL en el editor SQL de Supabase:');
        console.log(`
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
        `);
        
        // O intenta usar una consulta directa (puede requerir permisos adicionales)
        const { error } = await supabaseClient.rpc('create_click_count_column');
        
        if (error) {
            console.warn('No se pudo crear la columna automáticamente:', error.message);
        }
        
        return false;
    } catch (error) {
        console.warn('Error al intentar crear la columna:', error);
        return false;
    }
}

// Función para convertir Data URL a Blob
function dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

// Función para incrementar el contador de clics de un producto
async function incrementClickCount(productId) {
    if (!initSupabase()) {
        throw new Error('Supabase no inicializado');
    }

    try {
        // Primero, obtenemos el valor actual de click_count
        const { data: currentData, error: fetchError } = await supabaseClient
            .from('products')
            .select('click_count')
            .eq('id', productId)
            .single();

        if (fetchError) {
            // Si la columna no existe, la creamos
            if (fetchError.message.includes('column')) {
                console.warn('La columna click_count no existe, intentando crearla...');
                await createClickCountColumn();
                
                // Intentamos de nuevo después de crear la columna
                return await incrementClickCount(productId);
            }
            throw fetchError;
        }

        const currentCount = currentData.click_count || 0;
        const newCount = currentCount + 1;

        // Actualizamos con el nuevo valor
        const { data, error } = await supabaseClient
            .from('products')
            .update({ click_count: newCount })
            .eq('id', productId);

        if (error) throw error;

        return { success: true, newCount };
    } catch (error) {
        console.error('Error incrementando click count:', error);
        throw error;
    }
}
// Función para redirigir al login
function redirectToLogin() {
    if (!window.location.pathname.includes('admin-login.html')) {
        window.location.href = '/admin-login.html';
    }
}

// Exportar funciones Y el cliente con ambos nombres para compatibilidad
window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.checkAdminSession = checkAdminSession;
window.getCurrentUser = getCurrentUser;
window.supabaseClient = supabaseClient;
window.supabase = supabaseClient; // ← AGREGAR ESTA LÍNEA PARA COMPATIBILIDAD
// Exportar las nuevas funciones
window.uploadToStorage = uploadToStorage;
window.getPublicUrl = getPublicUrl;
window.dataURLtoBlob = dataURLtoBlob;
window.incrementClickCount = incrementClickCount;
