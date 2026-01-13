// Script para la página de login
document.addEventListener('DOMContentLoaded', function () {
    // Esperar a que Supabase esté listo
    function waitForSupabase(callback, maxAttempts = 10, interval = 100) {
        let attempts = 0;
        
        function check() {
            attempts++;
            if (typeof window.checkAdminSession !== 'undefined') {
                callback();
            } else if (attempts >= maxAttempts) {
                console.error('Supabase no se cargó después de ' + maxAttempts + ' intentos');
                document.getElementById('loginAlert').textContent = 'Error de configuración. Recarga la página.';
                document.getElementById('loginAlert').className = 'alert error';
                document.getElementById('loginAlert').style.display = 'block';
            } else {
                setTimeout(check, interval);
            }
        }
        
        check();
    }

    // Inicializar cuando Supabase esté listo
    waitForSupabase(function() {
        initLogin();
    });

    function initLogin() {
        // Verificar si ya hay sesión activa
        checkAdminSession().then(session => {
            if (session) {
                window.location.href = '/admin-panel.html';
            }
        });

        // Elementos del DOM
        const loginForm = document.getElementById('loginForm');
        const emailInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const togglePassword = document.getElementById('togglePassword');
        const loginAlert = document.getElementById('loginAlert');

        // Cambiar el placeholder para que diga "Email"
        if (emailInput) {
            emailInput.placeholder = "Ingresa tu email";
            emailInput.type = "email";
        }

        // Mostrar/ocultar contraseña
        togglePassword.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });

        // Manejar envío del formulario
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Obtener valores
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            // Validar campos
            if (!email || !password) {
                showAlert('Por favor completa todos los campos', 'error');
                return;
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showAlert('Por favor ingresa un email válido', 'error');
                return;
            }

            // Mostrar loading
            const submitBtn = loginForm.querySelector('.btn-login');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
            submitBtn.disabled = true;

            try {
                // Intentar login
                const result = await adminLogin(email, password);

                if (result.success) {
                    showAlert('Inicio de sesión exitoso. Redirigiendo...', 'success');

                    // Redirigir al panel después de 1 segundo
                    setTimeout(() => {
                        window.location.href = '/admin-panel.html';
                    }, 1000);
                } else {
                    showAlert(result.error || 'Email o contraseña incorrectos', 'error');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                showAlert('Error al iniciar sesión. Intenta nuevamente.', 'error');
                console.error('Login error:', error);
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });

        // Función para mostrar alertas
        function showAlert(message, type) {
            loginAlert.textContent = message;
            loginAlert.className = `alert ${type}`;
            loginAlert.style.display = 'block';

            // Ocultar alerta después de 5 segundos
            setTimeout(() => {
                loginAlert.style.display = 'none';
            }, 5000);
        }

        // Manejar tecla Enter
        passwordInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
    }
});