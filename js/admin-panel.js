// Script principal del panel de administración
window.updateHiddenColors = function () {
    const selectedColorsDiv = document.getElementById('selectedColors');
    const hiddenColorsInput = document.getElementById('productColors');

    if (selectedColorsDiv && hiddenColorsInput) {
        const colors = Array.from(selectedColorsDiv.querySelectorAll('.color-tag'))
            .map(tag => tag.getAttribute('data-color'));
        hiddenColorsInput.value = JSON.stringify(colors);
        console.log('Colores actualizados (global):', colors);
    } else {
        console.warn('No se encontraron elementos para actualizar colores');
    }
};

document.addEventListener('DOMContentLoaded', async function () {
    // Verificar sesión (ya redirige si no hay)
    await checkAdminSession();

    // Verificar que Supabase esté disponible
    if (!window.supabaseClient) {
        console.error('ERROR: Supabase no está inicializado');
        showAlert('Error de configuración. Recarga la página.', 'error');
        return;
    }

    // Alias para compatibilidad
    const supabase = window.supabaseClient;

    // Variables globales
    let currentPage = 1;
    const productsPerPage = 10;
    let allProducts = [];
    let editingProductId = null;

    // Inicializar la aplicación
    await initAdminPanel();

    async function initAdminPanel() {
        // Mostrar información del usuario
        const user = await getCurrentUser();
        if (user && user.email) {
            document.getElementById('adminUsername').textContent = user.email;
        }

        // Cargar datos
        await loadDashboardStats();
        await loadProducts();
        await loadMostClickedProducts();
        initEvents();
    }

    // Función para formatear precios con separadores de miles (AGREGAR AL INICIO DEL ARCHIVO)
    function formatPrice(price) {
        if (price === null || price === undefined) {
            return "L & L Confirmará El Precio";
        }

        // Convertir a número si es string
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;

        // Si no es un número válido
        if (isNaN(numPrice)) {
            return "L & L Confirmará El Precio";
        }

        // Redondear a 2 decimales primero
        const roundedPrice = Math.round(numPrice * 100) / 100;

        // Formatear con separadores de miles usando Intl.NumberFormat (más robusto)
        const formatter = new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            useGrouping: true
        });

        return formatter.format(roundedPrice);
    }

    // Cargar estadísticas del dashboard
    async function loadDashboardStats() {
        try {
            const { data: products, error } = await supabase
                .from('products')
                .select('id, is_active, is_offer');

            if (error) throw error;

            // Calcular estadísticas
            const totalProducts = products.length;
            const activeProducts = products.filter(p => p.is_active).length;
            const offerProducts = products.filter(p => p.is_offer).length;

            // Actualizar el DOM
            document.getElementById('totalProducts').textContent = totalProducts;
            document.getElementById('activeProducts').textContent = activeProducts;
            document.getElementById('offerProducts').textContent = offerProducts;

        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            showAlert('Error al cargar estadísticas', 'error');
        }
    }

// También actualiza la función loadMostClickedProducts:
async function loadMostClickedProducts() {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('click_count', { ascending: false }) // 🔥 Ordenar por clics
            .limit(10);

        if (error) {
            console.error('Error cargando productos clickeados:', error);
            // Si hay error por columna inexistente, usar orden por fecha
            const { data: fallbackData, error: fallbackError } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);
                
            if (fallbackError) throw fallbackError;
            renderMostClickedProducts(fallbackData || []);
            return;
        }

        renderMostClickedProducts(products || []);

    } catch (error) {
        console.error('Error cargando productos clickeados:', error);
        const container = document.getElementById('mostClickedList');
        if (container) {
            container.innerHTML = 
                '<p class="error">Error al cargar productos. Verifica la conexión.</p>';
        }
    }
}

// Función auxiliar para renderizar productos más clickeados
function renderMostClickedProducts(products) {
    const container = document.getElementById('mostClickedList');
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = '<p class="no-data">No hay productos disponibles</p>';
        return;
    }

    // Ordenar productos por número de clics (descendente)
    const sortedProducts = [...products].sort((a, b) => {
        const clicksA = a.click_count || 0;
        const clicksB = b.click_count || 0;
        return clicksB - clicksA;
    });

    container.innerHTML = sortedProducts.map(product => {
        // Obtener contador de clics (si existe)
        const clickCount = product.click_count || 0;

        return `
            <div class="most-clicked-item">
                <div class="most-clicked-image">
                    ${product.images && product.images.length > 0
                    ? `<img src="${product.images[0]}" alt="${product.title}" onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCveD0iMCAwIDUwIDUwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgZmlsbD0iI0U1RTVFNSIvPjxwYXRoIGQ9Ik0yNSAyNUMxOS40NzcyIDI1IDE1IDIwLjUyMjggMTUgMTVDMTUgOS40NzcyMiAxOS40NzcyIDUgMjUgNUMzMC41MjI4IDUgMzUgOS40NzcyMiAzNSAxNUMzNSAyMC41MjI4IDMxLjI5NDYgMjUgMjUgMjVaTTEwIDQwVjM1QzEwIDMwLjU4MTcgMTQuOTMzNCAyNi42MjUgMjAgMjYuNjI1SDMwQzM1LjA2NjYgMjYuNjI1IDQwIDMwLjU4MTcgNDAgMzVWNDBIMTAiIGZpbGw9IiNDQ0NDQ0MiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+'">`
                    : `<div class="no-image-small"><i class="fas fa-image"></i></div>`}
                </div>
                <div class="most-clicked-info">
                    <h4>${product.title}</h4>
                    <div class="most-clicked-details">
                        <p class="click-count">
                            <i class="fas fa-mouse-pointer"></i> Clics: 
                            <span class="count-number">${clickCount}</span>
                        </p>
                        ${product.price ? `<p><i class="fas fa-dollar-sign"></i> $${formatPrice(product.price)}</p>` : ''}
                        ${product.is_offer && product.offer_price ? `<p><i class="fas fa-tag"></i> Oferta: $${formatPrice(product.offer_price)}</p>` : ''}
                        <p class="status ${product.is_active ? 'active' : 'inactive'}">
                            ${product.is_active ? 'Activo' : 'Inactivo'}
                        </p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}



    // Cargar productos
    async function loadProducts(search = '', status = 'all') {
        try {
            let query = supabase.from('products').select('*').order('created_at', { ascending: false });

            // Aplicar filtros
            if (search) {
                query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
            }

            if (status === 'active') {
                query = query.eq('is_active', true);
            } else if (status === 'inactive') {
                query = query.eq('is_active', false);
            }

            const { data: products, error } = await query;

            if (error) throw error;

            allProducts = products || [];
            renderProducts();

        } catch (error) {
            console.error('Error cargando productos:', error);
            showAlert('Error al cargar productos', 'error');
        }
    }

    function renderProducts() {
        const productsList = document.getElementById('productsList');
        const pagination = document.getElementById('pagination');

        if (!productsList || !pagination) return;

        // Calcular paginación
        const totalPages = Math.ceil(allProducts.length / productsPerPage);
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const pageProducts = allProducts.slice(startIndex, endIndex);

        // Limpiar lista
        productsList.innerHTML = '';

        if (pageProducts.length === 0) {
            productsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <h3>No hay productos</h3>
                    <p>Comienza agregando tu primer producto</p>
                    <button class="btn-add" id="showAddFormEmpty">
                        <i class="fas fa-plus"></i> Agregar Producto
                    </button>
                </div>
            `;

            document.getElementById('showAddFormEmpty')?.addEventListener('click', showAddForm);
            return;
        }

        // Renderizar cada producto
        pageProducts.forEach(product => {
            const clickCount = product.click_count || 0;
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.innerHTML = `
                <div class="product-image">
                    ${product.images && product.images.length > 0
                    ? `<img src="${product.images[0]}" alt="${product.title}" onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiNFNUU1RTUiLz48cGF0aCBkPSJNNzUgNTBDNjguMTA0NiA1MCA2Mi41IDU1LjYwNDYgNjIuNSA2Mi41QzYyLjUgNjkuMzk1NCA2OC4xMDQ2IDc1IDc1IDc1QzgxLjg5NTQgNzUgODcuNSA2OS4zOTU0IDg3LjUgNjIuNUM4Ny41IDU1LjYwNDYgODQuMzA2NCA1MCA3NSA1MFpNMjAgMTI2LjI1QzIwIDExOC4yNzcgMjYuODMxNCAxMTEuNzUgMzUgMTExLjc1SDExNUwxMTUuNzUgMTM4LjI1SDM1QzI2LjgzMTQgMTM4LjI1IDIwIDEzMS43MjMgMjAgMTIzLjc1VjEyNi4yNVoiIGZpbGw9IiNDQ0NDQ0IiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+'">`
                    : `<div class="no-image"><i class="fas fa-image"></i></div>`}
                    ${clickCount > 0 ? `<div class="click-badge"><i class="fas fa-mouse-pointer"></i> ${clickCount}</div>` : ''}
                </div>
                <div class="product-info">
                    <div class="product-title">${product.title}</div>
                    <div class="product-description">${product.description || 'Sin descripción'}</div>
                    <div class="product-meta">
                  ${product.price
                    ? `<span class="product-price">$${formatPrice(product.price)}</span>`
                    : '<span class="product-price">Sin precio</span>'}
                   ${product.is_offer && product.offer_price
                    ? `<span class="product-offer">Oferta: $${formatPrice(product.offer_price)}</span>`
                    : ''}
                        <span class="product-status ${product.is_active ? 'status-active' : 'status-inactive'}">
                            ${product.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>
                </div>
                <div class="product-actions">
                    <button class="btn-action btn-edit" data-id="${product.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-toggle" data-id="${product.id}" 
                            data-active="${product.is_active}" title="${product.is_active ? 'Desactivar' : 'Activar'}">
                        <i class="fas fa-power-off"></i>
                    </button>
                    <button class="btn-action btn-delete" data-id="${product.id}" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            productsList.appendChild(productItem);
        });

        renderPagination(totalPages);
    }

    // Renderizar paginación
    function renderPagination(totalPages) {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        pagination.innerHTML = '';

        if (totalPages <= 1) return;

        // Botón anterior
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderProducts();
            }
        });
        pagination.appendChild(prevBtn);

        // Números de página
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderProducts();
            });
            pagination.appendChild(pageBtn);
        }

        // Botón siguiente
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderProducts();
            }
        });
        pagination.appendChild(nextBtn);
    }

    // Inicializar eventos
    function initEvents() {
        // Sidebar navigation
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();

                // Remover clase active de todos los enlaces
                document.querySelectorAll('.sidebar-menu a').forEach(l => {
                    l.classList.remove('active');
                });

                // Agregar clase active al enlace clickeado
                this.classList.add('active');

                // Ocultar todas las secciones
                document.querySelectorAll('.admin-section').forEach(section => {
                    section.classList.remove('active');
                });

                // Mostrar sección seleccionada
                const sectionId = this.getAttribute('data-section');
                document.getElementById(sectionId).classList.add('active');

                // Cerrar sidebar en móviles
                if (window.innerWidth < 992) {
                    document.getElementById('adminSidebar').classList.remove('show');
                }
            });
        });

        // Menu toggle
        document.getElementById('menuToggle').addEventListener('click', function () {
            document.getElementById('adminSidebar').classList.toggle('show');
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', function () {
            showConfirmModal(
                'Cerrar Sesión',
                '¿Estás seguro de que deseas cerrar sesión?',
                () => {
                    adminLogout();
                }
            );
        });

        // Buscar productos
        const productSearch = document.getElementById('productSearch');
        if (productSearch) {
            let searchTimeout;
            productSearch.addEventListener('input', function () {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    loadProducts(this.value, document.getElementById('statusFilter').value);
                }, 500);
            });
        }

        // Filtrar por estado
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', function () {
                loadProducts(document.getElementById('productSearch').value, this.value);
            });
        }

        // Mostrar formulario para agregar producto
        const showAddFormBtn = document.getElementById('showAddForm');
        if (showAddFormBtn) {
            showAddFormBtn.addEventListener('click', showAddForm);
        }

        // Acciones rápidas del dashboard
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const action = this.getAttribute('data-action');

                switch (action) {
                    case 'add-product':
                        showAddForm();
                        break;
                    case 'view-products':
                        document.querySelector('[data-section="products"]').click();
                        break;
                    case 'adjust-prices':
                        document.querySelector('[data-section="price-adjust"]').click();
                        break;
                }
            });
        });

        // Formulario de producto
        initProductForm();

        // Ajuste de precios
        initPriceAdjust();
    }

    // Mostrar formulario para agregar producto
    function showAddForm() {
        const formContainer = document.getElementById('productFormContainer');
        const formTitle = document.getElementById('formTitle');

        // Resetear formulario
        resetProductForm();

        // Configurar para agregar nuevo
        editingProductId = null;
        formTitle.textContent = 'Agregar Nuevo Producto';

        // Mostrar formulario
        formContainer.classList.add('show');

        // Desplazar hacia el formulario
        formContainer.scrollIntoView({ behavior: 'smooth' });

        // Cambiar a sección de productos si no está activa
        if (!document.getElementById('products').classList.contains('active')) {
            document.querySelector('[data-section="products"]').click();
        }
    }

    // Resetear formulario de producto
    function resetProductForm() {
        const form = document.getElementById('productForm');
        if (form) {
            form.reset();
            document.getElementById('productId').value = '';
            document.getElementById('imagePreview').innerHTML = '';
            document.getElementById('offerPriceGroup').style.display = 'none';
            document.getElementById('isActive').checked = true;

            // Limpiar colores
            const selectedColorsDiv = document.getElementById('selectedColors');
            if (selectedColorsDiv) selectedColorsDiv.innerHTML = '';
            const colorsInput = document.getElementById('productColors');
            if (colorsInput) colorsInput.value = JSON.stringify([]);
        }
    }

    // Inicializar formulario de producto
    function initProductForm() {
        const form = document.getElementById('productForm');
        const closeFormBtn = document.getElementById('closeForm');
        const cancelFormBtn = document.getElementById('cancelForm');
        const isOfferCheckbox = document.getElementById('isOffer');
        const imageUploadArea = document.getElementById('imageUploadArea');
        const productImagesInput = document.getElementById('productImages');
        initColorManagement();

        if (!form) return;

        // Cerrar formulario
        if (closeFormBtn) {
            closeFormBtn.addEventListener('click', function () {
                document.getElementById('productFormContainer').classList.remove('show');
            });
        }

        if (cancelFormBtn) {
            cancelFormBtn.addEventListener('click', function () {
                document.getElementById('productFormContainer').classList.remove('show');
            });
        }

        // Mostrar/ocultar precio de oferta
        if (isOfferCheckbox) {
            isOfferCheckbox.addEventListener('change', function () {
                document.getElementById('offerPriceGroup').style.display =
                    this.checked ? 'block' : 'none';
            });
        }

        // Subida de imágenes
        if (imageUploadArea && productImagesInput) {
            // Click en el área
            imageUploadArea.addEventListener('click', function () {
                productImagesInput.click();
            });

            // Arrastrar y soltar
            imageUploadArea.addEventListener('dragover', function (e) {
                e.preventDefault();
                this.style.borderColor = '#757270';
                this.style.background = 'rgba(117, 114, 112, 0.05)';
            });

            imageUploadArea.addEventListener('dragleave', function (e) {
                e.preventDefault();
                this.style.borderColor = '#e9ecef';
                this.style.background = '';
            });

            imageUploadArea.addEventListener('drop', function (e) {
                e.preventDefault();
                this.style.borderColor = '#e9ecef';
                this.style.background = '';

                const files = e.dataTransfer.files;
                handleImageFiles(files);
            });

            // Cambio en input file
            productImagesInput.addEventListener('change', function (e) {
                handleImageFiles(this.files);
            });
        }

        // Envío del formulario
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Validar formulario
            if (!validateProductForm()) {
                return;
            }

            // Mostrar loading
            const submitBtn = document.getElementById('submitProduct');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            submitBtn.disabled = true;

            try {
                // Obtener datos del formulario
                const formData = new FormData(form);
                const productData = {
                    title: formData.get('title'),
                    description: formData.get('description'),
                    details: formData.get('details'),
                    price: formData.get('price') ? parseFloat(formData.get('price')) : null,
                    is_offer: formData.get('is_offer') === 'on',
                    is_active: formData.get('is_active') === 'on',
                    offer_price: formData.get('offer_price') ? parseFloat(formData.get('offer_price')) : null
                };

                // AGREGAR COLORES - ESTO ES LO QUE FALTA
                const colorsInput = document.getElementById('productColors');
                if (colorsInput) {
                    try {
                        const colorsValue = colorsInput.value;
                        productData.colors = colorsValue ? JSON.parse(colorsValue) : [];
                        console.log('🎨 Colores a guardar:', productData.colors);
                    } catch (error) {
                        console.error('Error parseando colores:', error);
                        productData.colors = [];
                    }
                } else {
                    productData.colors = [];
                    console.warn('No se encontró el input de colores');
                }

                // Procesar imágenes
                const imagePreviews = document.querySelectorAll('.preview-item');
                const imageUrls = [];
                const newImages = [];

                // Separar imágenes existentes de nuevas
                for (const preview of imagePreviews) {
                    const img = preview.querySelector('img');
                    const src = img.src;

                    // Si es una nueva imagen (Data URL)
                    if (src.startsWith('data:')) {
                        // Convertir Data URL a Blob
                        const blob = await fetch(src).then(r => r.blob());
                        const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
                        newImages.push({
                            blob: blob,
                            fileName: fileName
                        });
                    }
                    // Si es una URL existente (ya subida)
                    else {
                        imageUrls.push(src);
                    }
                }

                // Subir nuevas imágenes a Supabase Storage
                for (const newImage of newImages) {
                    try {
                        const filePath = `${Date.now()}-${newImage.fileName}`;

                        console.log('Subiendo imagen:', filePath, newImage.blob.size, 'bytes');

                        // Subir a Supabase Storage
                        const { data, error } = await supabase.storage
                            .from('product-images')
                            .upload(filePath, newImage.blob, {
                                cacheControl: '3600',
                                upsert: false
                            });

                        if (error) {
                            console.error('Error detallado al subir:', error);
                            throw error;
                        }

                        // Obtener URL pública
                        const { data: urlData } = supabase.storage
                            .from('product-images')
                            .getPublicUrl(filePath);

                        console.log('URL obtenida:', urlData.publicUrl);
                        imageUrls.push(urlData.publicUrl);

                    } catch (uploadError) {
                        console.error('Error subiendo imagen:', uploadError);
                        throw new Error(`Error al subir imagen: ${uploadError.message}`);
                    }
                }

                productData.images = imageUrls;
                console.log('📦 Datos completos del producto a guardar:', productData);

                let result;
                if (editingProductId) {
                    const { data, error } = await supabase
                        .from('products')
                        .update(productData)
                        .eq('id', editingProductId);

                    if (error) throw error;
                    result = { success: true, message: 'Producto actualizado correctamente' };
                } else {
                    const { data, error } = await supabase
                        .from('products')
                        .insert([productData]);

                    if (error) throw error;
                    result = { success: true, message: 'Producto creado correctamente' };
                }

                showAlert(result.message, 'success');
                document.getElementById('productFormContainer').classList.remove('show');

                // Recargar todas las secciones
                await loadProducts();
                await loadDashboardStats();
                await loadMostClickedProducts(); // <-- AÑADIR ESTA LÍNEA

            } catch (error) {
                console.error('Error guardando producto:', error);
                showAlert('Error al guardar el producto: ' + error.message, 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });

        // Delegación de eventos para acciones de productos
        document.addEventListener('click', async function (e) {
            // Editar producto
            if (e.target.closest('.btn-edit')) {
                const productId = e.target.closest('.btn-edit').getAttribute('data-id');
                await editProduct(productId);
            }

            // Activar/Desactivar producto
            if (e.target.closest('.btn-toggle')) {
                const btn = e.target.closest('.btn-toggle');
                const productId = btn.getAttribute('data-id');
                const isActive = btn.getAttribute('data-active') === 'true';

                await toggleProductStatus(productId, isActive);
            }

            // Eliminar producto
            if (e.target.closest('.btn-delete')) {
                const productId = e.target.closest('.btn-delete').getAttribute('data-id');

                showConfirmModal(
                    'Eliminar Producto',
                    '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.',
                    async () => {
                        await deleteProduct(productId);
                    }
                );
            }
        });
    }

    // Validar formulario de producto
    function validateProductForm() {
        const title = document.getElementById('productTitle').value.trim();
        const details = document.getElementById('productDetails').value.trim();

        if (!title) {
            showAlert('El título del producto es requerido', 'error');
            return false;
        }

        if (!details) {
            showAlert('Los detalles/medidas son requeridos', 'error');
            return false;
        }

        return true;
    }

    // Manejar archivos de imagen
    function handleImageFiles(files) {
        const imagePreview = document.getElementById('imagePreview');
        const maxImages = 5;

        // Verificar límite
        const currentImages = imagePreview.querySelectorAll('.preview-item').length;
        if (currentImages + files.length > maxImages) {
            showAlert(`Máximo ${maxImages} imágenes permitidas`, 'warning');
            return;
        }

        Array.from(files).forEach(file => {
            // Verificar tipo de archivo
            if (!file.type.startsWith('image/')) {
                showAlert(`El archivo "${file.name}" no es una imagen válida`, 'warning');
                return;
            }

            // Verificar tamaño (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showAlert(`La imagen "${file.name}" es demasiado grande (máximo 5MB)`, 'warning');
                return;
            }

            // Crear preview
            const reader = new FileReader();
            reader.onload = function (e) {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';

                previewItem.dataset.fileName = file.name;
                previewItem.dataset.fileType = file.type;
                previewItem.dataset.isNew = 'true';

                previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="remove-image" title="Eliminar">
                    <i class="fas fa-times"></i>
                </button>
            `;

                imagePreview.appendChild(previewItem);

                // Agregar evento para eliminar
                previewItem.querySelector('.remove-image').addEventListener('click', function () {
                    previewItem.remove();
                });
            };

            reader.readAsDataURL(file);
        });
    }

    // Editar producto
    async function editProduct(productId) {
        console.log('🔄 Editando producto ID:', productId);

        try {
            const { data: product, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();

            if (error) {
                console.error('Error obteniendo producto:', error);
                throw error;
            }

            console.log('📦 Producto cargado para edición:', product);

            // Configurar formulario
            editingProductId = productId;
            document.getElementById('formTitle').textContent = 'Editar Producto';
            document.getElementById('productId').value = productId;
            document.getElementById('productTitle').value = product.title || '';
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('productDetails').value = product.details || '';
            document.getElementById('productPrice').value = product.price ? formatPrice(product.price) : '';
            document.getElementById('isOffer').checked = product.is_offer;
            document.getElementById('isActive').checked = product.is_active;
            document.getElementById('offerPrice').value = product.offer_price ? formatPrice(product.offer_price) : '';

            // Mostrar/ocultar precio de oferta
            document.getElementById('offerPriceGroup').style.display =
                product.is_offer ? 'block' : 'none';

            // Cargar imágenes
            const imagePreview = document.getElementById('imagePreview');
            imagePreview.innerHTML = '';

            if (product.images && product.images.length > 0) {
                product.images.forEach((imageUrl, index) => {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'preview-item';
                    previewItem.innerHTML = `
                        <img src="${imageUrl}" alt="Imagen ${index + 1}">
                        <button type="button" class="remove-image" title="Eliminar">
                            <i class="fas fa-times"></i>
                        </button>
                    `;

                    imagePreview.appendChild(previewItem);

                    // Agregar evento para eliminar
                    previewItem.querySelector('.remove-image').addEventListener('click', function () {
                        previewItem.remove();
                    });
                });
            }

            // Cargar colores
            const selectedColorsDiv = document.getElementById('selectedColors');
            const colorsInput = document.getElementById('productColors');

            if (selectedColorsDiv && colorsInput) {
                selectedColorsDiv.innerHTML = '';

                console.log('🎨 Colores del producto:', product.colors);

                if (product.colors && Array.isArray(product.colors)) {
                    // Filtrar valores nulos o vacíos
                    const validColors = product.colors.filter(color => color && color.trim() !== '');

                    validColors.forEach(color => {
                        const colorTag = document.createElement('div');
                        colorTag.className = 'color-tag';
                        colorTag.setAttribute('data-color', color);
                        colorTag.innerHTML = `
                            ${color}
                            <button type="button" class="remove-color" title="Eliminar color">
                                <i class="fas fa-times"></i>
                            </button>
                        `;

                        colorTag.querySelector('.remove-color').addEventListener('click', function () {
                            colorTag.remove();
                            // Actualizar el input hidden
                            window.updateHiddenColors();
                        });

                        selectedColorsDiv.appendChild(colorTag);
                    });

                    // Actualizar el input hidden con los colores existentes
                    colorsInput.value = JSON.stringify(validColors);
                    console.log('✅ Colores cargados para edición:', validColors);
                } else {
                    colorsInput.value = JSON.stringify([]);
                    console.log('ℹ️ No hay colores para este producto');
                }

                // Llamar a updateHiddenColors para asegurar sincronización
                window.updateHiddenColors();
            }

            // Mostrar formulario
            const formContainer = document.getElementById('productFormContainer');
            formContainer.classList.add('show');
            formContainer.scrollIntoView({ behavior: 'smooth' });

            console.log('✅ Formulario de edición cargado correctamente');

        } catch (error) {
            console.error('❌ Error cargando producto para editar:', error);
            showAlert('Error al cargar el producto para editar: ' + error.message, 'error');
        }
    }

    async function toggleProductStatus(productId, isActive) {
        try {
            const { error } = await supabase
                .from('products')
                .update({ is_active: !isActive })
                .eq('id', productId);

            if (error) throw error;

            showAlert(`Producto ${!isActive ? 'activado' : 'desactivado'} correctamente`, 'success');

            // Recargar todas las secciones
            await loadProducts();
            await loadDashboardStats();
            await loadMostClickedProducts(); // <-- AÑADIR ESTA LÍNEA

        } catch (error) {
            console.error('Error cambiando estado del producto:', error);
            showAlert('Error al cambiar el estado del producto', 'error');
        }
    }

    // Eliminar producto
    async function deleteProduct(productId) {
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (error) throw error;

            showAlert('Producto eliminado correctamente', 'success');

            // Recargar todas las secciones
            await loadProducts();
            await loadDashboardStats();
            await loadMostClickedProducts(); // <-- AÑADIR ESTA LÍNEA

        } catch (error) {
            console.error('Error eliminando producto:', error);
            showAlert('Error al eliminar el producto', 'error');
        }
    }

    // Inicializar ajuste de precios - VERSIÓN CORREGIDA
    function initPriceAdjust() {
        const adjustPercentage = document.getElementById('adjustPercentage');
        const adjustType = document.getElementById('adjustType');
        const applyBtn = document.getElementById('applyAdjust');
        const previewBtn = document.getElementById('previewAdjust');
        const applyToOffersCheckbox = document.getElementById('applyToOffers');

        if (!adjustPercentage || !applyBtn) return;

        // Actualizar vista previa simple
        function updatePreview() {
            const percentage = parseFloat(adjustPercentage.value);
            const type = adjustType.value;

            let newPrice = 100;
            if (type === 'increase') {
                newPrice = 100 * (1 + percentage / 100);
            } else {
                newPrice = 100 * (1 - percentage / 100);
                // Asegurar que no sea negativo
                newPrice = Math.max(0, newPrice);
            }

            document.getElementById('previewPrice').textContent =
                `$${formatPrice(newPrice)}`;
        }

        // Event listeners
        adjustPercentage.addEventListener('input', updatePreview);
        adjustType.addEventListener('change', updatePreview);

        // Vista previa completa
        previewBtn?.addEventListener('click', async function () {
            const percentage = parseFloat(adjustPercentage.value);
            const type = adjustType.value;
            const applyToOffers = applyToOffersCheckbox.checked;

            if (!percentage || percentage <= 0 || percentage > 100) {
                showAlert('Porcentaje inválido', 'error');
                return;
            }

            try {
                // Obtener productos
                const { data: products, error } = await supabase
                    .from('products')
                    .select('*')
                    .not('price', 'is', null);

                if (error) throw error;

                // Generar vista previa
                const previewBody = document.getElementById('previewTableBody');
                previewBody.innerHTML = '';

                let hasChanges = false;

                products.forEach(product => {
                    if (!product.price) return;

                    const currentPrice = parseFloat(product.price);
                    const currentOfferPrice = product.offer_price ? parseFloat(product.offer_price) : null;

                    let newPrice, newOfferPrice;

                    // Calcular nuevo precio normal
                    if (type === 'increase') {
                        newPrice = currentPrice * (1 + percentage / 100);
                    } else {
                        newPrice = currentPrice * (1 - percentage / 100);
                        newPrice = Math.max(0, newPrice); // No permitir precios negativos
                    }

                    // Calcular nuevo precio de oferta si aplica
                    if (applyToOffers && currentOfferPrice) {
                        if (type === 'increase') {
                            newOfferPrice = currentOfferPrice * (1 + percentage / 100);
                        } else {
                            newOfferPrice = currentOfferPrice * (1 - percentage / 100);
                            newOfferPrice = Math.max(0, newOfferPrice);
                        }
                        newOfferPrice = Math.round(newOfferPrice * 100) / 100;
                    }

                    // Redondear a 2 decimales
                    newPrice = Math.round(newPrice * 100) / 100;

                    const hasPriceChange = Math.abs(newPrice - currentPrice) > 0.01;
                    const hasOfferChange = applyToOffers && currentOfferPrice &&
                        Math.abs(newOfferPrice - currentOfferPrice) > 0.01;

                    if (hasPriceChange || hasOfferChange) {
                        hasChanges = true;

                        const row = document.createElement('tr');
                        row.innerHTML = `
    <td>${product.title}</td>
    <td>$${formatPrice(currentPrice)}</td>
    <td>${currentOfferPrice ? `$${formatPrice(currentOfferPrice)}` : '-'}</td>
    <td>$${formatPrice(newPrice)}</td>
    <td>${applyToOffers && currentOfferPrice ? `$${formatPrice(newOfferPrice)}` : '-'}</td>
    <td>${type === 'increase' ? '+' : '-'}${percentage}%</td>
`;
                        previewBody.appendChild(row);
                    }
                });

                if (hasChanges) {
                    document.getElementById('previewTableContainer').style.display = 'block';
                } else {
                    showAlert('No hay productos que cumplan con los criterios', 'info');
                }

            } catch (error) {
                console.error('Error generando vista previa:', error);
                showAlert('Error al generar vista previa', 'error');
            }
        });

        // Aplicar ajuste
        applyBtn.addEventListener('click', async function () {
            const percentage = parseFloat(adjustPercentage.value);
            const type = adjustType.value;
            const applyToOffers = applyToOffersCheckbox.checked;

            if (!percentage || percentage <= 0 || percentage > 100) {
                showAlert('Porcentaje inválido', 'error');
                return;
            }

            showConfirmModal(
                'Aplicar Ajuste de Precios',
                `¿Estás seguro de aplicar un ${type === 'increase' ? 'aumento' : 'reducción'} del ${percentage}% a todos los productos?` +
                (applyToOffers ? ' (Se incluirán precios de oferta)' : ' (Solo precios normales)'),
                async () => {
                    try {
                        // Obtener productos
                        const { data: products, error } = await supabase
                            .from('products')
                            .select('*')
                            .not('price', 'is', null);

                        if (error) throw error;

                        // Actualizar precios
                        const updates = [];
                        let updatedCount = 0;

                        products.forEach(product => {
                            if (!product.price) return;

                            const currentPrice = parseFloat(product.price);
                            const currentOfferPrice = product.offer_price ? parseFloat(product.offer_price) : null;

                            let newPrice, newOfferPrice;

                            // Calcular nuevo precio normal
                            if (type === 'increase') {
                                newPrice = currentPrice * (1 + percentage / 100);
                            } else {
                                newPrice = currentPrice * (1 - percentage / 100);
                                newPrice = Math.max(0, newPrice); // No permitir precios negativos
                            }

                            // Calcular nuevo precio de oferta si aplica
                            if (applyToOffers && currentOfferPrice) {
                                if (type === 'increase') {
                                    newOfferPrice = currentOfferPrice * (1 + percentage / 100);
                                } else {
                                    newOfferPrice = currentOfferPrice * (1 - percentage / 100);
                                    newOfferPrice = Math.max(0, newOfferPrice);
                                }
                                newOfferPrice = Math.round(newOfferPrice * 100) / 100;
                            }

                            // Redondear a 2 decimales
                            newPrice = Math.round(newPrice * 100) / 100;

                            const hasPriceChange = Math.abs(newPrice - currentPrice) > 0.01;
                            const hasOfferChange = applyToOffers && currentOfferPrice &&
                                Math.abs(newOfferPrice - currentOfferPrice) > 0.01;

                            if (hasPriceChange || hasOfferChange) {
                                const updateData = {
                                    price: newPrice.toString()
                                };

                                if (applyToOffers && currentOfferPrice) {
                                    updateData.offer_price = newOfferPrice.toString();
                                }

                                updates.push({
                                    id: product.id,
                                    data: updateData
                                });
                                updatedCount++;
                            }
                        });

                        // Aplicar actualizaciones en lotes
                        if (updates.length > 0) {
                            const updatePromises = updates.map(async (update) => {
                                const { error: updateError } = await supabase
                                    .from('products')
                                    .update(update.data)
                                    .eq('id', update.id);

                                if (updateError) {
                                    console.error(`Error actualizando producto ${update.id}:`, updateError);
                                    throw updateError;
                                }
                                return true;
                            });

                            await Promise.all(updatePromises);

                            showAlert(
                                `Precios actualizados correctamente (${updatedCount} productos)`,
                                'success'
                            );

                            // Ocultar vista previa
                            document.getElementById('previewTableContainer').style.display = 'none';

                            // Recargar productos y estadísticas
                            await loadProducts();
                            await loadDashboardStats();

                        } else {
                            showAlert('No hay productos que requieran actualización', 'info');
                        }

                    } catch (error) {
                        console.error('Error aplicando ajuste de precios:', error);
                        showAlert('Error al aplicar el ajuste de precios', 'error');
                    }
                }
            );
        });

        // Inicializar vista previa
        updatePreview();
    }
    // Mostrar modal de confirmación (función existente)
    function showConfirmModal(title, message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalConfirm = document.getElementById('modalConfirm');
        const modalCancel = document.getElementById('modalCancel');
        const modalClose = document.getElementById('modalClose');

        modalTitle.textContent = title;
        modalMessage.textContent = message;

        // Mostrar modal
        modal.classList.add('show');

        // Configurar eventos
        const confirmHandler = function () {
            modal.classList.remove('show');
            onConfirm();
            removeEventListeners();
        };

        const cancelHandler = function () {
            modal.classList.remove('show');
            removeEventListeners();
        };

        const removeEventListeners = function () {
            modalConfirm.removeEventListener('click', confirmHandler);
            modalCancel.removeEventListener('click', cancelHandler);
            modalClose.removeEventListener('click', cancelHandler);
        };

        modalConfirm.addEventListener('click', confirmHandler);
        modalCancel.addEventListener('click', cancelHandler);
        modalClose.addEventListener('click', cancelHandler);
    }

    // Función para inicializar el manejo de colores
    function initColorManagement() {
        const colorInput = document.getElementById('colorInput');
        const addColorBtn = document.getElementById('addColorBtn');
        const selectedColorsDiv = document.getElementById('selectedColors');
        const hiddenColorsInput = document.getElementById('productColors');

        // Verificar que los elementos existan
        if (!colorInput || !addColorBtn || !selectedColorsDiv || !hiddenColorsInput) {
            console.error('❌ Elementos de colores no encontrados en el DOM');
            return;
        }

        console.log('✅ Sistema de colores inicializado');

        // Función para actualizar el input hidden
        function updateHiddenColorsLocal() {
            const colors = Array.from(selectedColorsDiv.querySelectorAll('.color-tag'))
                .map(tag => tag.getAttribute('data-color'));
            hiddenColorsInput.value = JSON.stringify(colors);
            console.log('🎨 Colores actualizados:', colors);
        }

        // Sincronizar con la función global
        window.updateHiddenColors = updateHiddenColorsLocal;

        // Función para agregar un color
        function addColor(color) {
            if (!color.trim()) {
                console.warn('Intento de agregar color vacío');
                return;
            }

            // Verificar si ya existe
            const existing = Array.from(selectedColorsDiv.querySelectorAll('.color-tag'))
                .some(tag => tag.getAttribute('data-color').toLowerCase() === color.toLowerCase());

            if (existing) {
                showAlert('Este color ya fue agregado', 'warning');
                return;
            }

            // Crear elemento de color
            const colorTag = document.createElement('div');
            colorTag.className = 'color-tag';
            colorTag.setAttribute('data-color', color);
            colorTag.innerHTML = `
                ${color}
                <button type="button" class="remove-color" title="Eliminar color">
                    <i class="fas fa-times"></i>
                </button>
            `;

            // Evento para eliminar
            colorTag.querySelector('.remove-color').addEventListener('click', function () {
                colorTag.remove();
                updateHiddenColorsLocal();
            });

            selectedColorsDiv.appendChild(colorTag);
            updateHiddenColorsLocal();
            colorInput.value = '';

            console.log('✅ Color agregado:', color);
        }

        // Evento para agregar color con botón
        addColorBtn.addEventListener('click', () => {
            addColor(colorInput.value);
        });

        // Evento para agregar con Enter
        colorInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addColor(colorInput.value);
            }
        });

        // Evento para procesar múltiples colores separados por coma
        colorInput.addEventListener('blur', () => {
            const value = colorInput.value;
            if (value.includes(',')) {
                const colors = value.split(',').map(c => c.trim()).filter(c => c);
                colors.forEach(color => addColor(color));
                colorInput.value = '';
            }
        });

        // Limpiar colores al resetear formulario
        document.getElementById('productForm')?.addEventListener('reset', () => {
            selectedColorsDiv.innerHTML = '';
            updateHiddenColorsLocal();
        });

        // Inicializar con array vacío si no hay valor
        if (!hiddenColorsInput.value || hiddenColorsInput.value === '') {
            hiddenColorsInput.value = JSON.stringify([]);
        }

        console.log('🎨 Sistema de colores listo');
    }

    // Mostrar alerta flotante
    function showAlert(message, type) {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) return;

        const alertId = 'alert-' + Date.now();
        const alertItem = document.createElement('div');
        alertItem.id = alertId;
        alertItem.className = `alert-item ${type}`;
        alertItem.innerHTML = `
            <div class="alert-icon ${type}">
                ${type === 'success' ? '<i class="fas fa-check-circle"></i>' :
                type === 'error' ? '<i class="fas fa-exclamation-circle"></i>' :
                    type === 'warning' ? '<i class="fas fa-exclamation-triangle"></i>' :
                        '<i class="fas fa-info-circle"></i>'}
            </div>
            <div class="alert-content">
                <h4>${type === 'success' ? 'Éxito' :
                type === 'error' ? 'Error' :
                    type === 'warning' ? 'Advertencia' : 'Información'}</h4>
                <p>${message}</p>
            </div>
            <button class="alert-close" onclick="document.getElementById('${alertId}').remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        alertContainer.appendChild(alertItem);

        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                alert.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => alert.remove(), 300);
            }
        }, 5000);
    }
});