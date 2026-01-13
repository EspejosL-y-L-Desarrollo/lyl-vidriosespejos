// =============================================
// ARCHIVO app.js CORREGIDO - VERSIÓN DEFINITIVA
// =============================================

// Variables globales - DECLARADAS EXPLÍCITAMENTE
window.cart = [];
window.currentSlide = 0;
window.slideInterval = null;
window.products = []; // ← ESTA ES LA CLAVE

// Función de productos de respaldo
function getFallbackProducts() {
    return [
        {
            id: 'fallback-1',
            name: 'Producto de ejemplo',
            description: 'Descripción del producto de ejemplo',
            details: 'Medidas: 100x100 cm',
            price: 99.99,
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiNFNUU1RTUiLz48dGV4dCB4PSI3NSIgeT0iNzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlByb2R1Y3RvIDx0c3BhbiBkeT0iMTUiPkRlIEVqZW1wbG88L3RzcGFuPjwvdGV4dD48L3N2Zz4=',
            images: [],
            is_offer: false,
            offer_price: null
        }
    ];
}

// =============================================
// 1. INICIALIZACIÓN PRINCIPAL
// =============================================

// =============================================
// MODIFICAR LA FUNCIÓN initializeApplication
// =============================================
async function initializeApplication() {
    console.log('🚀 INICIANDO APLICACIÓN...');

    try {
        // Paso 1: Verificar Supabase
        console.log('1. Verificando Supabase...');
        if (!window.supabaseClient) {
            console.error('❌ Supabase no está disponible');
            throw new Error('Supabase no inicializado');
        }
        console.log('✅ Supabase disponible');

        // Paso 2: Cargar productos
        console.log('2. Cargando productos...');
        await loadProductsFromSupabase();

        // Paso 3: Inicializar búsqueda y renderizar productos
        console.log('3. Inicializando búsqueda...');
        initSearch();
        
        console.log('4. Mostrando productos...');
        renderProducts();

        // Paso 4: Inicializar resto de componentes
        console.log('5. Inicializando componentes...');
        loadCart();
        initBannerSlider();
        initEvents();
        updateCartCount();
        initDarkMode();

        console.log('✅ APLICACIÓN INICIALIZADA CORRECTAMENTE');

    } catch (error) {
        console.error('❌ Error en inicialización:', error);

        // Usar productos de respaldo
        window.products = getFallbackProducts();
        window.filteredProducts = [];
        renderProducts();

        showNotification('Error al cargar los productos. Mostrando datos de ejemplo.');
    }
}


// =============================================
// MODIFICAR LA FUNCIÓN loadProductsFromSupabase
// =============================================
async function loadProductsFromSupabase() {
    console.log('📦 CARGANDO PRODUCTOS DESDE SUPABASE...');

    try {
        // Consultar productos activos
        const { data: productsData, error } = await window.supabaseClient
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error de Supabase:', error);
            throw error;
        }

        console.log(`📊 Productos obtenidos: ${productsData?.length || 0}`);

        if (!productsData || productsData.length === 0) {
            console.warn('⚠️ No hay productos activos');
            window.products = [];
            window.filteredProducts = [];
            return;
        }

        // Mapear productos al formato de la aplicación
        window.products = productsData.map(item => {
            console.log(`Procesando producto: ${item.id} - ${item.title}`);

            // Determinar imagen principal
            let mainImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiNFNUU1RTUiLz48cGF0aCBkPSJNNzUgNTBDNjguMTA0NiA1MCA2Mi41IDU1LjYwNDYgNjIuNSA2Mi41QzYyLjUgNjkuMzk1NCA2OC4xMDQ2IDc1IDc1IDc1QzgxLjg5NTQgNzUgODcuNSA2OS4zOTU0IDg3LjUgNjIuNUM4Ny41IDU1LjYwNDYgODQuMzA2NCA1MCA3NSA1MFpNMjAgMTI2LjI1QzIwIDExOC4yNzcgMjYuODMxNCAxMTEuNzUgMzUgMTExLjc1SDExNUwxMTUuNzUgMTM4LjI1SDM1QzI2LjgzMTQgMTM4LjI1IDIwIDEzMS43MjMgMjAgMTIzLjc1VjEyNi4yNVoiIGZpbGw9IiNDQ0NDQ0MiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+';

            if (item.images && item.images.length > 0 && item.images[0]) {
                mainImage = item.images[0];

                // Si es una URL de Supabase Storage
                if (mainImage.includes('storage.supabase.com')) {
                    if (!mainImage.includes('?')) {
                        mainImage = `${mainImage}?t=${Date.now()}`;
                    }
                }
            }

            return {
                id: item.id,
                name: item.title || 'Producto sin título',
                description: item.description || '',
                details: item.details || '',
                price: item.price ? parseFloat(item.price) : null,
                image: mainImage,
                images: item.images || [],
                is_offer: item.is_offer || false,
                offer_price: item.offer_price ? parseFloat(item.offer_price) : null,
                colors: item.colors || []
            };
        });

        // Inicializar filteredProducts con todos los productos
        window.filteredProducts = [];
        window.searchTerm = '';
        window.currentPage = 1;

        console.log(`✅ ${window.products.length} productos cargados exitosamente`);

    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        throw error;
    }
}

function loadProducts() {
    console.log('🎨 RENDERIZANDO PRODUCTOS...');

    const catalogGrid = document.getElementById('catalogGrid');
    if (!catalogGrid) {
        console.error('❌ No se encontró catalogGrid');
        return;
    }

    catalogGrid.innerHTML = '';

    console.log(`📊 Cantidad de productos a renderizar: ${window.products?.length || 0}`);

    // Si no hay productos
    if (!window.products || window.products.length === 0) {
        catalogGrid.innerHTML = `
            <div class="empty-products">
                <i class="fas fa-box-open"></i>
                <h3>No hay productos disponibles</h3>
                <p>Prueba a recargar la página o contacta con el administrador.</p>
                <button onclick="location.reload()" class="reload-btn">
                    <i class="fas fa-sync-alt"></i> Recargar página
                </button>
                <button onclick="testSupabaseConnection()" class="test-btn">
                    <i class="fas fa-bug"></i> Probar conexión
                </button>
            </div>
        `;
        return;
    }

    // Renderizar cada producto
    window.products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.setAttribute('data-id', product.id);
        productCard.style.cursor = 'pointer'; // Hacer que el cursor sea pointer

        // Determinar precio a mostrar
        let priceDisplay = '';
        if (product.price !== null) {
            if (product.is_offer && product.offer_price) {
                priceDisplay = `
                    <div class="product-price">
                        <span class="old-price">$${formatPrice(product.price)}</span>
                        <span class="offer-price">$${formatPrice(product.offer_price)}</span>
                        <span class="offer-badge">Oferta</span>
                    </div>
                `;
            } else {
                priceDisplay = `<div class="product-price">$${formatPrice(product.price)}</div>`;
            }
        } else {
            priceDisplay = '<div class="product-price no-price">Consultar precio</div>';
        }

        // Crear HTML del producto
        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.name}" class="product-img" 
                    onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGNUY1RjUiLz48cGF0aCBkPSJNNjIgODRDNjIgNjkuNjQgNzMuNjQgNTggODggNThIMTEyQzEyNi4zNiA1OCAxMzggNjkuNjQgMTM4IDg0VjExNkMxMzggMTMwLjM2IDEyNi4zNiAxNDIgMTEyIDE0Mkg4OEM3My42NCAxNDIgNjIgMTMwLjM2IDYyIDExNlY4NFpNNDYgMTU2QzQ2IDE0NS41IDU0LjUgMTM3IDY1IDEzN0gxMzVMMTM2LjUgMTcwSDY1QzU0LjUgMTcwIDQ2IDE2MS41IDQ2IDE1MVYxNTZaIiBmaWxsPSIjQ0NDQ0NDIiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PHRleHQgeD0iMTAwIiB5PSIxMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg='">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-desc">${product.description || ''}</p>
                ${product.details ? `<p class="product-details"><small>${product.details}</small></p>` : ''}
                ${priceDisplay}
                <button class="product-btn">
                    <i class="fas fa-eye"></i> Ver Detalles
                </button>
                
            </div>
            
        `;

        catalogGrid.appendChild(productCard);

        // Agregar evento de clic a toda la tarjeta
        productCard.addEventListener('click', function (event) {
            // Solo activar si el clic no fue en el botón
            if (!event.target.closest('.product-btn')) {
                viewProduct(product.id);
            }
        });

        // Agregar evento de clic específico al botón
        const button = productCard.querySelector('.product-btn');
        button.addEventListener('click', function (event) {
            event.stopPropagation(); // Prevenir que el clic se propague a la tarjeta
            viewProduct(product.id);
        });
    });

    console.log(`✅ ${window.products.length} productos renderizados`);
}



// En lugar de hacer el PATCH directamente, usa:
async function incrementProductClick(productId) {
    try {
        const result = await incrementClickCount(productId);
        console.log(`✅ Contador actualizado: ${productId} - ${result.newCount} clics`);
        return result;
    } catch (error) {
        console.error('Error al incrementar contador:', error);
        // Método alternativo si falla
        return await alternativeIncrement(productId);
    }
}
// =============================================
// 4. FUNCIONES DE PRODUCTOS
// =============================================
function viewProduct(productId) {
    const product = window.products.find(p => p.id === productId || p.id.toString() === productId);
    if (!product) {
        console.error('Producto no encontrado:', productId);
        showNotification('Producto no encontrado');
        return;
    }
       incrementClickCount(productId);

    const modalProductContent = document.getElementById('modalProductContent');

    // Determinar precio a mostrar
    let priceDisplay = '';
    if (product.price !== null) {
        if (product.is_offer && product.offer_price) {
            priceDisplay = `
                <div class="modal-price">
                    <span style="text-decoration: line-through; color: #999;">$${formatPrice(product.price)}</span>
                    <span style="color: var(--accent-color); margin-left: 10px; font-size: 1.2em;">$${formatPrice(product.offer_price)}</span>
                    <span class="offer-badge">Oferta</span>
                </div>
            `;
        } else {
            priceDisplay = `<div class="modal-price">${formatPrice(product.price)}</div>`;
        }
    } else {
        priceDisplay = '<div class="modal-price">L & L Confirmara El Precio</div>';
    }

    // Crear HTML del selector de colores si existen
    let colorsHtml = '';
    if (product.colors && Array.isArray(product.colors) && product.colors.length > 0) {
        const colors = product.colors.filter(c => c && c.trim() !== '');
        if (colors.length > 0) {
            colorsHtml = `
                <div class="color-selector">
                    <h4>Color de Marco Disponible:</h4>
                    <div class="color-options" id="colorOptions">
                        ${colors.map(color => `
                            <div class="color-option" data-color="${color}">
                                <div class="color-circle generic" style="background-color: ${getColorCode(color)};">
                                    ${getColorInitials(color)}
                                </div>
                                <div class="color-label">${color}</div>
                            </div>
                        `).join('')}
                    </div>
                    <input type="hidden" id="selectedColor" value="">
                </div>
            `;
        }
    }


    // Crear HTML del carrusel de imágenes
    let imagesHtml = '';
    if (product.images && product.images.length > 0) {
        // Usar todas las imágenes del producto
        const allImages = product.images;

        imagesHtml = `
            <div class="product-carousel">
                <div class="carousel-images" id="carouselImages">
                    ${allImages.map((img, index) => `
                        <div class="carousel-slide ${index === 0 ? 'active' : ''}">
                            <img src="${img}" alt="${product.name} - Imagen ${index + 1}" 
                                onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiNFNUU1RTUiLz48cGF0aCBkPSJNNzUgNTBDNjguMTA0NiA1MCA2Mi41IDU1LjYwNDYgNjIuNSA2Mi41QzYyLjUgNjkuMzk1NCA2OC4xMDQ2IDc1IDc1IDc1QzgxLjg5NTQgNzUgODcuNSA2OS4zOTU0IDg3LjUgNjIuNUM4Ny41IDU1LjYwNDYgODQuMzA2NCA1MCA3NSA1MFpNMjAgMTI2LjI1QzIwIDExOC4yNzcgMjYuODMxNCAxMTEuNzUgMzUgMTExLjc1SDExNUwxMTUuNzUgMTM4LjI1SDM1QzI2LjgzMTQgMTM4LjI1IDIwIDEzMS43MjMgMjAgMTIzLjc1VjEyNi4yNVoiIGZpbGw9IiNDQ0NDQ0MiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+'">
                        </div>
                    `).join('')}
                </div>
                
                ${allImages.length > 1 ? `
                    <div class="carousel-controls">
                        <button class="carousel-prev" onclick="changeCarouselSlide(-1)">❮</button>
                        <button class="carousel-next" onclick="changeCarouselSlide(1)">❯</button>
                    </div>
                    
                    <div class="carousel-indicators" id="carouselIndicators">
                        ${allImages.map((_, index) => `
                            <span class="indicator ${index === 0 ? 'active' : ''}" onclick="goToCarouselSlide(${index})"></span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    } else {
        // Si no hay imágenes múltiples, usar solo la imagen principal
        imagesHtml = `
            <div class="modal-img-container">
                <img src="${product.image}" alt="${product.name}" class="modal-img" 
                    onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiNFNUU1RTUiLz48cGF0aCBkPSJNNzUgNTBDNjguMTA0NiA1MCA2Mi41IDU1LjYwNDYgNjIuNSA2Mi41QzYyLjUgNjkuMzk1NCA2OC4xMDQ2IDc1IDc1IDc1QzgxLjg5NTQgNzUgODcuNSA2OS4zOTU0IDg3LjUgNjIuNUM4Ny41IDU1LjYwNDYgODQuMzA2NCA1MCA3NSA1MFpNMjAgMTI2LjI1QzIwIDExOC4yNzcgMjYuODMxNCAxMTEuNzUgMzUgMTExLjc1SDExNUwxMTUuNzUgMTM4LjI1SDM1QzI2LjgzMTQgMTM4LjI1IDIwIDEzMS43MjMgMjAgMTIzLjc1VjEyNi4yNVoiIGZpbGw9IiNDQ0NDQ0MiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+'">
            </div>
        `;
    }

    modalProductContent.innerHTML = `
    <div class="modal-img-carousel">
        ${imagesHtml}
    </div>
    <div class="modal-info">
        <h2 class="modal-title">${product.name}</h2>
        ${priceDisplay}
        <p class="modal-desc">${product.description}</p>
        ${product.details ? `<p class="modal-details"><strong>Detalles:</strong> ${product.details}</p>` : ''}
        
        ${colorsHtml}
        
        <div class="quantity-selector">
            <button class="quantity-btn" onclick="changeQuantity(-1)">-</button>
            <span class="quantity" id="productQuantity">1</span>
            <button class="quantity-btn" onclick="changeQuantity(1)">+</button>
        </div>
        <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">Agregar al Carrito</button>
    </div>
`;

    // Inicializar selector de colores si existe
    if (colorsHtml) {
        initColorSelector();
    }

    // Reinicializar el carrusel si hay múltiples imágenes
    if (product.images && product.images.length > 1) {
        initProductCarousel();
    }

    document.getElementById('productModal').style.display = 'block';
    // Inicializar el carrusel si hay múltiples imágenes
if (product.images && product.images.length > 1) {
    initProductCarousel();
}

// Agregar funcionalidad de doble click a la imagen
setTimeout(() => {
    const modalImg = document.querySelector('.modal-img-container img') || 
                     document.querySelector('.product-carousel img');
    
    if (modalImg) {
        // Variable para controlar el estado de zoom
        let isZoomed = false;
        let originalTransform = '';
        
        modalImg.style.cursor = 'zoom-in';
        modalImg.style.transition = 'transform 0.3s ease';
        
        modalImg.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            
            if (!isZoomed) {
                // Agrandar la imagen
                originalTransform = this.style.transform;
                this.style.transform = 'scale(2)';
                this.style.cursor = 'zoom-out';
                this.style.zIndex = '1000';
                
                // Crear overlay para cerrar al hacer clic fuera
                const overlay = document.createElement('div');
                overlay.className = 'image-overlay';
                overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                    z-index: 999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;
                
                overlay.addEventListener('click', function() {
                    modalImg.style.transform = originalTransform;
                    modalImg.style.cursor = 'zoom-in';
                    isZoomed = false;
                    document.body.removeChild(overlay);
                    modalImg.style.zIndex = '';
                });
                
                document.body.appendChild(overlay);
                isZoomed = true;
            } else {
                // Volver al tamaño normal
                this.style.transform = originalTransform;
                this.style.cursor = 'zoom-in';
                isZoomed = false;
                
                // Eliminar overlay si existe
                const overlay = document.querySelector('.image-overlay');
                if (overlay) {
                    document.body.removeChild(overlay);
                }
                modalImg.style.zIndex = '';
            }
        });
        
        // También permitir zoom con toque doble en móviles
        let lastTouchEnd = 0;
        modalImg.addEventListener('touchend', function(event) {
            const now = new Date().getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
                this.dispatchEvent(new Event('dblclick'));
            }
            lastTouchEnd = now;
        });
    }
}, 100);

// También para imágenes del carrusel
if (product.images && product.images.length > 1) {
    setTimeout(() => {
        const carouselImages = document.querySelectorAll('.carousel-slide img');
        carouselImages.forEach(img => {
            let isZoomed = false;
            let originalTransform = '';
            
            img.style.cursor = 'zoom-in';
            img.style.transition = 'transform 0.3s ease';
            
            img.addEventListener('dblclick', function(e) {
                e.stopPropagation();
                
                if (!isZoomed) {
                    // Agrandar la imagen
                    originalTransform = this.style.transform;
                    this.style.transform = 'scale(2)';
                    this.style.cursor = 'zoom-out';
                    this.style.zIndex = '1000';
                    this.style.position = 'relative';
                    
                    // Crear overlay para cerrar al hacer clic fuera
                    const overlay = document.createElement('div');
                    overlay.className = 'image-overlay';
                    overlay.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0,0,0,0.8);
                        z-index: 999;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    `;
                    
                    overlay.addEventListener('click', function() {
                        img.style.transform = originalTransform;
                        img.style.cursor = 'zoom-in';
                        isZoomed = false;
                        document.body.removeChild(overlay);
                        img.style.zIndex = '';
                    });
                    
                    document.body.appendChild(overlay);
                    isZoomed = true;
                } else {
                    // Volver al tamaño normal
                    this.style.transform = originalTransform;
                    this.style.cursor = 'zoom-in';
                    isZoomed = false;
                    
                    // Eliminar overlay si existe
                    const overlay = document.querySelector('.image-overlay');
                    if (overlay) {
                        document.body.removeChild(overlay);
                    }
                    img.style.zIndex = '';
                }
            });
            
            // Para móviles
            let lastTouchEnd = 0;
            img.addEventListener('touchend', function(event) {
                const now = new Date().getTime();
                if (now - lastTouchEnd <= 300) {
                    event.preventDefault();
                    this.dispatchEvent(new Event('dblclick'));
                }
                lastTouchEnd = now;
            });
        });
    }, 100);
}
}


// Función auxiliar para obtener código de color
function getColorCode(colorName) {
    const colorMap = {
        'blanco': '#ffffff',
        'negro': '#000000',
        'rojo': '#ff0000',
        'azul': '#0000ff',
        'verde': '#00ff00',
        'amarillo': '#ffff00',
        'gris': '#808080',
        'madera': '#8b4513',
        'marron': '#8b4513',
        'beige': '#f5f5dc',
        'plateado': '#c0c0c0',
        'dorado': '#ffd700',
        'transparente': 'transparent'
    };

    const lowerColor = colorName.toLowerCase().trim();
    return colorMap[lowerColor] || '#f0f0f0';
}

// Función auxiliar para obtener iniciales del color
function getColorInitials(colorName) {
    const words = colorName.split(' ');
    if (words.length === 1) {
        return colorName.substring(0, 2).toUpperCase();
    }
    return words.map(word => word[0].toUpperCase()).join('').substring(0, 3);
}

// Inicializar selector de colores
function initColorSelector() {
    const colorOptions = document.querySelectorAll('.color-option');
    const selectedColorInput = document.getElementById('selectedColor');

    colorOptions.forEach(option => {
        option.addEventListener('click', function () {
            // Remover selección previa
            colorOptions.forEach(opt => opt.classList.remove('selected'));

            // Agregar selección actual
            this.classList.add('selected');

            // Actualizar input hidden
            const color = this.getAttribute('data-color');
            selectedColorInput.value = color;
        });

        // Seleccionar primero por defecto
        if (colorOptions[0] && !selectedColorInput.value) {
            colorOptions[0].click();
        }
    });
}

// Variables para el carrusel de imágenes del producto
let currentProductSlide = 0;
let productImages = [];

// Inicializar carrusel de producto
function initProductCarousel() {
    currentProductSlide = 0;
    productImages = document.querySelectorAll('.carousel-slide');

    if (productImages.length > 1) {
        // Auto avance cada 5 segundos (opcional)
        clearInterval(window.productCarouselInterval);
        window.productCarouselInterval = setInterval(() => {
            changeCarouselSlide(1);
        }, 5000);
    }
}

// Cambiar slide del carrusel
function changeCarouselSlide(direction) {
    if (!productImages || productImages.length === 0) return;

    // Remover clase active del slide actual
    productImages[currentProductSlide].classList.remove('active');
    const indicators = document.querySelectorAll('#carouselIndicators .indicator');
    if (indicators[currentProductSlide]) {
        indicators[currentProductSlide].classList.remove('active');
    }

    // Calcular nuevo índice
    currentProductSlide += direction;
    if (currentProductSlide < 0) currentProductSlide = productImages.length - 1;
    if (currentProductSlide >= productImages.length) currentProductSlide = 0;

    // Agregar clase active al nuevo slide
    productImages[currentProductSlide].classList.add('active');
    if (indicators[currentProductSlide]) {
        indicators[currentProductSlide].classList.add('active');
    }

    // Restablecer intervalo
    clearInterval(window.productCarouselInterval);
    window.productCarouselInterval = setInterval(() => {
        changeCarouselSlide(1);
    }, 5000);
}

function goToCarouselSlide(index) {
    if (!productImages || productImages.length === 0 || index < 0 || index >= productImages.length) return;

    // Remover clase active del slide actual
    productImages[currentProductSlide].classList.remove('active');
    const indicators = document.querySelectorAll('#carouselIndicators .indicator');
    if (indicators[currentProductSlide]) {
        indicators[currentProductSlide].classList.remove('active');
    }

    // Actualizar índice
    currentProductSlide = index;

    // Agregar clase active al nuevo slide
    productImages[currentProductSlide].classList.add('active');
    if (indicators[currentProductSlide]) {
        indicators[currentProductSlide].classList.add('active');
    }

    // Restablecer intervalo
    clearInterval(window.productCarouselInterval);
    window.productCarouselInterval = setInterval(() => {
        changeCarouselSlide(1);
    }, 5000);
}



// Cambiar cantidad en el modal de producto
function changeQuantity(change) {
    const quantityElement = document.getElementById('productQuantity');
    let quantity = parseInt(quantityElement.textContent);
    quantity += change;
    if (quantity < 1) quantity = 1;
    if (quantity > 10) quantity = 10;
    quantityElement.textContent = quantity;
}


// Modifica la función addToCart para incluir color
function addToCart(productId) {
    const quantity = parseInt(document.getElementById('productQuantity').textContent);
    const product = window.products.find(p => p.id === productId);

    // Obtener color seleccionado
    let selectedColor = '';
    const selectedColorInput = document.getElementById('selectedColor');
    if (selectedColorInput) {
        selectedColor = selectedColorInput.value;
    }

    // Cerrar modal de producto
    document.getElementById('productModal').style.display = 'none';

    // Verificar si el producto ya está en el carrito
    const existingItemIndex = window.cart.findIndex(item =>
        item.id === productId && item.color === selectedColor
    );

    if (existingItemIndex >= 0) {
        // Actualizar cantidad si ya existe
        window.cart[existingItemIndex].quantity += quantity;
    } else {
        // Agregar nuevo producto al carrito
        const productPrice = product.price !== null && product.price !== undefined ?
            product.price : null;

        window.cart.push({
            id: product.id,
            name: product.name,
            price: productPrice,
            image: product.image,
            quantity: quantity,
            color: selectedColor
        });
    }

    // Actualizar carrito
    saveCart();
    updateCartCount();
    showNotification(`${product.name}${selectedColor ? ' (' + selectedColor + ')' : ''} agregado al carrito`);
}


// Función para formatear precios con separadores de miles
function formatPrice(price) {
    if (price === null || price === undefined) {
        return "L & L Confirmara El Precio";
    }
    
    // Convertir a número si es string
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    // Separar parte entera y decimal
    const [entero, decimal] = numPrice.toFixed(2).split('.');
    
    // Agregar puntos como separadores de miles
    const enteroFormateado = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${enteroFormateado}.${decimal}`;
}
// =============================================
// 5. FUNCIONES DE NOTIFICACIÓN
// =============================================

// Mostrar notificación
function showNotification(message) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background-color: #27ae60;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 2000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Eliminar notificación después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);

    // Agregar animaciones CSS si no existen
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// =============================================
// 6. FUNCIONES DEL CARRITO
// =============================================

// Cargar carrito desde localStorage
function loadCart() {
    const savedCart = localStorage.getItem('vidriosCart');
    if (savedCart) {
        window.cart = JSON.parse(savedCart);
    }
}

// Guardar carrito en localStorage
function saveCart() {
    localStorage.setItem('vidriosCart', JSON.stringify(window.cart));
}

// Actualizar contador del carrito
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    const totalItems = window.cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
}

// Abrir carrito
function openCart() {
    const cartModal = document.getElementById('cartModal');
    cartModal.style.display = 'block';
    showCartItems();
    renderCartItems();
}

// Cerrar carrito
function closeCartModal() {
    const cartModal = document.getElementById('cartModal');
    cartModal.style.display = 'none';
}

// Mostrar productos en el carrito
function showCartItems() {
    document.getElementById('cartItemsStep').style.display = 'block';
    document.getElementById('checkoutForm').style.display = 'none';
    document.getElementById('orderSummary').style.display = 'none';
}

// Mostrar formulario de checkout
function showCheckoutForm() {
    if (window.cart.length === 0) {
        alert('El carrito está vacío. Agregue productos antes de continuar.');
        return;
    }

    document.getElementById('cartItemsStep').style.display = 'none';
    document.getElementById('checkoutForm').style.display = 'block';
    document.getElementById('orderSummary').style.display = 'none';
}

// Mostrar resumen del pedido
function showOrderSummary() {
    // Validar formulario
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const email = document.getElementById('customerEmail').value;

    if (!name || !phone || !email) {
        alert('Por favor complete todos los campos obligatorios (*)');
        return;
    }

    // Obtener valores del formulario
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked').value;
    const address = document.getElementById('customerAddress').value;
    const notes = document.getElementById('orderNotes').value;

    // Mostrar valores en el resumen
    document.getElementById('summaryName').textContent = name;
    document.getElementById('summaryPhone').textContent = phone;
    document.getElementById('summaryEmail').textContent = email;
    document.getElementById('summaryDelivery').textContent = deliveryMethod;
    document.getElementById('summaryAddress').textContent = address || 'No aplica';
    document.getElementById('summaryNotes').textContent = notes || 'Ninguna';

    // Mostrar/ocultar dirección según método de entrega
    const addressContainer = document.getElementById('summaryAddressContainer');
    if (deliveryMethod === 'Envío a domicilio' && address) {
        addressContainer.style.display = 'block';
    } else {
        addressContainer.style.display = 'none';
    }


    // Mostrar productos en el resumen
    const summaryProducts = document.getElementById('summaryProducts');
    summaryProducts.innerHTML = '';

    let total = 0;
    let hasProductsWithoutPrice = false;
    let hasProductsWithPrice = false;

    window.cart.forEach(item => {
        let itemTotal = 0;
        let itemDisplay = '';

        if (item.price !== null) {
            itemTotal = item.price * item.quantity;
            total += itemTotal;
            itemDisplay = `$${formatPrice(itemTotal)}`;
            hasProductsWithPrice = true;
        } else {
            itemDisplay = 'L & L Confirmara El Precio';
            hasProductsWithoutPrice = true;
        }

        const productElement = document.createElement('div');
        productElement.className = 'order-product';
        productElement.innerHTML = `
            <div>
                <strong>${item.name} x${item.quantity}</strong>
                ${item.color ? `<div class="order-product-color">Color: ${item.color}</div>` : ''}
            </div>
            <div>${itemDisplay}</div>
        `;
        summaryProducts.appendChild(productElement);
    });

    // Mostrar total - manejar diferentes casos
    const summaryTotalElement = document.getElementById('summaryTotal');
    if (hasProductsWithPrice && hasProductsWithoutPrice) {
        // Caso 1: Hay productos con y sin precio
        summaryTotalElement.textContent = `${formatPrice(total)} + Precio a Confirmar`;
    } else if (hasProductsWithPrice && !hasProductsWithoutPrice) {
        // Caso 2: Solo productos con precio
        summaryTotalElement.textContent = `$${formatPrice(total)}`;
    } else if (!hasProductsWithPrice && hasProductsWithoutPrice) {
        // Caso 3: Solo productos sin precio (TU CASO)
        summaryTotalElement.textContent = `Precio a  Confirmar`;
    } else {
        // Caso 4: Carrito vacío (no debería pasar aquí)
        summaryTotalElement.textContent = `$0.00`;
    }

    // Mostrar resumen
    document.getElementById('cartItemsStep').style.display = 'none';
    document.getElementById('checkoutForm').style.display = 'none';
    document.getElementById('orderSummary').style.display = 'block';
}

// =============================================
// 6. FUNCIONES DEL CARRITO (VERSIÓN CORREGIDA)
// =============================================
function renderCartItems() {
    const cartItems = document.getElementById('cartItems');
    const cartTotalContainer = document.querySelector('.cart-total');

    cartItems.innerHTML = '';

    if (window.cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: #777;">El carrito está vacío</p>';
        if (cartTotalContainer) {
            cartTotalContainer.innerHTML = '<strong>Total: $<span id="cartTotal">0</span></strong>';
        }
        return;
    }

    let total = 0;
    let hasProductsWithoutPrice = false;
    let hasProductsWithPrice = false;

    window.cart.forEach((item, index) => {
        // Calcular total - solo para productos con precio
        let itemTotal = 0;
        let priceDisplay = '';

        if (item.price !== null) {
            itemTotal = item.price * item.quantity;
            total += itemTotal;
            priceDisplay = `$${formatPrice(item.price)} c/u`;
            hasProductsWithPrice = true;
        } else {
            priceDisplay = 'L & L Confirmara El Precio';
            hasProductsWithoutPrice = true;
        }

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.name}</div>
                ${item.color ? `<div class="cart-item-color">Color: ${item.color}</div>` : ''}
                <div class="cart-item-price">${priceDisplay}</div>
                <div class="cart-item-quantity">
                    <button onclick="updateCartItemQuantity(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartItemQuantity(${index}, 1)">+</button>
                </div>
                <button class="remove-item" onclick="removeCartItem(${index})">Eliminar</button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });

    // Mostrar total del carrito - VERSIÓN CORREGIDA
    // Buscar el elemento del total
    const cartTotalElement = document.getElementById('cartTotal');
    const cartTotalLabel = cartTotalElement ? cartTotalElement.previousSibling : null;

    // Determinar qué mostrar según los productos en el carrito
    if (hasProductsWithoutPrice && !hasProductsWithPrice) {
        // CASO 1: Solo productos sin precio - Mostrar solo "A confirmar"
        if (cartTotalElement) {
            cartTotalElement.textContent = 'L & L Confirmara El Precio';
            // Ocultar la etiqueta "Total: $"
            if (cartTotalLabel && cartTotalLabel.nodeType === 3) { // Es un nodo de texto
                cartTotalLabel.textContent = '';
            }
        }
    } else if (hasProductsWithPrice && !hasProductsWithoutPrice) {
        // CASO 2: Solo productos con precio - Mostrar "Total: $X.XX"
        if (cartTotalElement) {
            cartTotalElement.textContent = formatPrice(total);
            // Mostrar la etiqueta "Total: $"
            if (cartTotalLabel && cartTotalLabel.nodeType === 3) {
                cartTotalLabel.textContent = 'Total: $';
            }
        }
    } else {
        // CASO 3: Mezcla de productos con y sin precio - Mostrar total parcial
        if (cartTotalElement) {
            cartTotalElement.textContent = `${formatPrice(total)} + L & L Confirmara El Precio`;
            // Mostrar la etiqueta "Total: $"
            if (cartTotalLabel && cartTotalLabel.nodeType === 3) {
                cartTotalLabel.textContent = 'Total: $';
            }
        }
    }
}
// Función alternativa más simple usando el contenedor completo
function renderCartItemsSimple() {
    const cartItems = document.getElementById('cartItems');
    const cartTotalContainer = document.querySelector('.cart-total');

    cartItems.innerHTML = '';

    if (window.cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: #777;">El carrito está vacío</p>';
        if (cartTotalContainer) {
            cartTotalContainer.innerHTML = '<strong>Total: $<span id="cartTotal">0</span></strong>';
        }
        return;
    }

    let total = 0;
    let hasProductsWithoutPrice = false;
    let hasProductsWithPrice = false;

    window.cart.forEach((item, index) => {
        let itemTotal = 0;
        let priceDisplay = '';

        if (item.price !== null) {
            itemTotal = item.price * item.quantity;
            total += itemTotal;
           priceDisplay = `$${formatPrice(item.price)} c/u`;
            hasProductsWithPrice = true;
        } else {
            priceDisplay = 'L & L Confirmara El Precio ';
            hasProductsWithoutPrice = true;
        }

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">${priceDisplay}</div>
                <div class="cart-item-quantity">
                    <button onclick="updateCartItemQuantity(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartItemQuantity(${index}, 1)">+</button>
                </div>
                <button class="remove-item" onclick="removeCartItem(${index})">Eliminar</button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });

    // ACTUALIZAR EL TOTAL DE FORMA MÁS SIMPLE - REEMPLAZANDO TODO EL CONTENIDO
    if (cartTotalContainer) {
        if (hasProductsWithoutPrice && !hasProductsWithPrice) {
            // Solo productos sin precio
            cartTotalContainer.innerHTML = '<strong><span id="cartTotal">L & L Confirmara El Precio</span></strong>';
        } else if (hasProductsWithPrice && !hasProductsWithoutPrice) {
            // Solo productos con precio
           cartTotalContainer.innerHTML = `<strong>Total: $<span id="cartTotal">${formatPrice(total)}</span></strong>`;
        } else {
            // Mezcla de productos
            cartTotalContainer.innerHTML = `<strong>Total: $<span id="cartTotal">${formatPrice(total)} + L & L Confirmara El Precio</span></strong>`;
        }
    }
}
// Actualizar cantidad de un producto en el carrito
function updateCartItemQuantity(index, change) {
    window.cart[index].quantity += change;

    if (window.cart[index].quantity <= 0) {
        window.cart.splice(index, 1);
    }

    saveCart();
    updateCartCount();
    renderCartItems();
}

// Eliminar producto del carrito
function removeCartItem(index) {
    window.cart.splice(index, 1);
    saveCart();
    updateCartCount();
    renderCartItems();
}

// Finalizar pedido y redirigir a WhatsApp
function finalizeOrder() {
    // Obtener datos del formulario
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const email = document.getElementById('customerEmail').value;
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked').value;
    const address = document.getElementById('customerAddress').value;
    const notes = document.getElementById('orderNotes').value;

    let message = `Hola, quiero realizar el siguiente pedido:%0A%0A`;
    message += `*Nombre:* ${name}%0A`;
    message += `*Teléfono:* ${phone}%0A`;
    message += `*Correo:* ${email}%0A`;
    message += `*Método de entrega:* ${deliveryMethod}%0A`;

    if (deliveryMethod === 'Envío a domicilio' && address) {
        message += `*Dirección:* ${address}%0A`;
    }

    if (notes) {
        message += `*Aclaraciones:* ${notes}%0A`;
    }

    message += `%0A*Detalles del pedido:*%0A`;

    let total = 0;
    let hasProductsWithoutPrice = false;
    let hasProductsWithPrice = false;

    window.cart.forEach(item => {
        let itemText = `- ${item.name} x${item.quantity}`;

        if (item.color) {
            itemText += ` (Color: ${item.color})`;
        }

        if (item.price !== null) {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            itemText += `: $${formatPrice(itemTotal)}`;
            hasProductsWithPrice = true;
        } else {
            itemText += `: A CONFIRMAR`;
            hasProductsWithoutPrice = true;
        }

        message += itemText + '%0A';
    });

    if (hasProductsWithPrice && hasProductsWithoutPrice) {
        message += `*Total parcial:* ${formatPrice(total)}%0A`;
        message += `*Nota:* Algunos productos requieren confirmación de precio%0A`;
    } else if (hasProductsWithPrice && !hasProductsWithoutPrice) {
        message += `*Total:* ${formatPrice(total)}%0A`;
    } else if (!hasProductsWithPrice && hasProductsWithoutPrice) {
        // Solo productos sin precio
        message += `*Nota:* Todos los productos requieren confirmación de precio%0A`;
    }

    message += `%0APor favor, confirmen disponibilidad y formas de pago. ¡Gracias!`;

    // Número de WhatsApp de la empresa (cambiar por el número real)
    const whatsappNumber = "3584829285";

    // Crear enlace de WhatsApp
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

    // Limpiar carrito después de finalizar
    window.cart = [];
    saveCart();
    updateCartCount();

    // Cerrar modal del carrito
    closeCartModal();

    // Redirigir a WhatsApp
    window.open(whatsappUrl, '_blank');

    // Mostrar mensaje de confirmación
    showNotification('Pedido enviado a WhatsApp correctamente');
}

// =============================================
// 7. FUNCIONES DEL SLIDER
// =============================================

// Inicializar banner deslizante
function initBannerSlider() {
    const slides = document.querySelectorAll('.banner-slide');
    const indicators = document.querySelectorAll('.indicator');

    // Función para cambiar slide
    function goToSlide(index) {
        window.currentSlide = index;
        const slider = document.getElementById('bannerSlider');
        slider.style.transform = `translateX(-${window.currentSlide * 100}%)`;

        // Actualizar indicadores
        indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === window.currentSlide);
        });
    }

    // Configurar indicadores
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            clearInterval(window.slideInterval);
            goToSlide(index);
            startSlider();
        });
    });

    // Función para siguiente slide
    function nextSlide() {
        window.currentSlide = (window.currentSlide + 1) % slides.length;
        goToSlide(window.currentSlide);
    }

    // Iniciar auto-desplazamiento
    function startSlider() {
        clearInterval(window.slideInterval);
        window.slideInterval = setInterval(nextSlide, 5000);
    }

    startSlider();
}

// =============================================
// 8. INICIALIZACIÓN DE EVENTOS
// =============================================

// Inicializar eventos
function initEvents() {
    // Menú hamburguesa - CORREGIDO
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Cerrar menú al hacer click en un enlace (en móviles)
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // Modal de producto
    const closeModal = document.getElementById('closeModal');
    const productModal = document.getElementById('productModal');

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            productModal.style.display = 'none';
            clearInterval(window.productCarouselInterval);
               // Remover overlay de zoom si existe
        const overlay = document.querySelector('.image-overlay');
        if (overlay) {
            document.body.removeChild(overlay);
        }
        
        // Habilitar scroll
        document.body.classList.remove('no-scroll');
    });
    }

   // Cerrar modal al hacer click fuera del contenido
window.addEventListener('click', (e) => {
    if (e.target === productModal) {
        productModal.style.display = 'none';
        clearInterval(window.productCarouselInterval);
        
        // Remover overlay de zoom si existe
        const overlay = document.querySelector('.image-overlay');
        if (overlay) {
            document.body.removeChild(overlay);
        }
        
        // Habilitar scroll
        document.body.classList.remove('no-scroll');
    }
});

    // Carrito de compras
    const cartIcon = document.getElementById('cartIcon');
    const cartModal = document.getElementById('cartModal');
    const closeCart = document.getElementById('closeCart');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const backToCartBtn = document.getElementById('backToCartBtn');
    const continueToSummaryBtn = document.getElementById('continueToSummaryBtn');
    const backToFormBtn = document.getElementById('backToFormBtn');
    const finalizeOrderBtn = document.getElementById('finalizeOrderBtn');

    if (cartIcon) cartIcon.addEventListener('click', openCart);
    if (closeCart) closeCart.addEventListener('click', closeCartModal);

    // Cerrar carrito al hacer click fuera del contenido
    window.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            closeCartModal();
        }
    });

    if (checkoutBtn) checkoutBtn.addEventListener('click', showCheckoutForm);
    if (backToCartBtn) backToCartBtn.addEventListener('click', showCartItems);
    if (continueToSummaryBtn) continueToSummaryBtn.addEventListener('click', showOrderSummary);
    if (backToFormBtn) backToFormBtn.addEventListener('click', showCheckoutForm);
    if (finalizeOrderBtn) finalizeOrderBtn.addEventListener('click', finalizeOrder);

    // Formulario de contacto - MODIFICADO para redirigir a WhatsApp
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const name = document.getElementById('contactName').value;
            const email = document.getElementById('contactEmail').value;
            const message = document.getElementById('contactMessage').value;

            // Crear mensaje para WhatsApp
            const whatsappMessage = `Hola, me contacto a través de la página web.%0A%0A*Nombre:* ${name}%0A*Correo:* ${email}%0A*Mensaje:* ${message}`;

            // Número de WhatsApp de la empresa
            const whatsappNumber = "3584829285";

            // Crear enlace de WhatsApp
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

            // Redirigir a WhatsApp
            window.open(whatsappUrl, '_blank');

            // Resetear formulario
            contactForm.reset();

            // Mostrar notificación
            showNotification('Redirigiendo a WhatsApp...');
        });
    }

    // Smooth scroll para enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
     // Eventos de paginación
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', prevPage);
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', nextPage);
    }
    
    // Permitir búsqueda con Enter
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
    }
}

// =============================================
// 9. FUNCIONALIDAD DE MODO OSCURO
// =============================================

// Inicializar modo oscuro
function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    // Verificar preferencia guardada o del sistema
    const savedMode = localStorage.getItem('darkMode');
    const systemPrefersDark = prefersDarkScheme.matches;

    // Aplicar modo oscuro si está guardado o si el sistema lo prefiere (y no hay preferencia guardada)
    if (savedMode === 'true' || (!savedMode && systemPrefersDark)) {
        enableDarkMode();
    } else {
        disableDarkMode();
    }

    // Agregar evento al botón
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }

    // Escuchar cambios en la preferencia del sistema
    prefersDarkScheme.addEventListener('change', (e) => {
        // Solo cambiar si el usuario no ha establecido una preferencia
        if (!localStorage.getItem('darkMode')) {
            if (e.matches) {
                enableDarkMode();
            } else {
                disableDarkMode();
            }
        }
    });
}

// Activar modo oscuro
function enableDarkMode() {
    document.body.classList.add('dark-mode');
    const icon = document.querySelector('#darkModeToggle i');
    if (icon) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
    localStorage.setItem('darkMode', 'true');
}

// Desactivar modo oscuro
function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    const icon = document.querySelector('#darkModeToggle i');
    if (icon) {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
    localStorage.setItem('darkMode', 'false');
}

// Alternar modo oscuro
function toggleDarkMode() {
    if (document.body.classList.contains('dark-mode')) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
}

// =============================================
// 10. FUNCIONES DE DIAGNÓSTICO
// =============================================

// Función para probar conexión con Supabase
async function testSupabaseConnection() {
    console.log('🔍 PROBANDO CONEXIÓN SUPABASE...');

    try {
        const { data, error } = await window.supabaseClient
            .from('products')
            .select('id, title')
            .eq('is_active', true)
            .limit(1);

        if (error) {
            console.error('❌ Error en conexión:', error);
            alert(`Error de conexión: ${error.message}`);
        } else {
            console.log('✅ Conexión exitosa:', data);
            alert(`Conexión exitosa. Productos encontrados: ${data?.length || 0}`);

            // Recargar productos
            await loadProductsFromSupabase();
            loadProducts();
        }
    } catch (error) {
        console.error('❌ Error en test:', error);
        alert('Error en la prueba de conexión');
    }
}

// Función para recargar productos manualmente
window.reloadProducts = async function () {
    console.log('🔄 RECARGANDO PRODUCTOS MANUALMENTE...');
    await loadProductsFromSupabase();
    loadProducts();
    showNotification('Productos recargados');
};

// =============================================
// 11. INICIALIZACIÓN CUANDO SUPABASE ESTÉ LISTO
// =============================================

// Verificar cada 100ms si Supabase está listo
let supabaseCheckInterval = setInterval(() => {
    if (window.supabaseClient && window.supabaseClient.from) {
        clearInterval(supabaseCheckInterval);
        console.log('✅ Supabase listo, iniciando aplicación...');
        initializeApplication();
    }
}, 100);

// Timeout después de 10 segundos
setTimeout(() => {
    clearInterval(supabaseCheckInterval);
    if (!window.supabaseClient) {
        console.error('❌ Timeout: Supabase no se cargó en 10 segundos');
        window.products = getFallbackProducts();
        loadProducts();
        showNotification('Usando datos de ejemplo');
    }
}, 10000);

// =============================================
// 12. CSS TEMPORAL PARA MENSAJES
// =============================================

// Agrega este CSS si no existe
const style = document.createElement('style');
style.textContent = `
    .empty-products {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        background: #f8f9fa;
        border-radius: 10px;
        border: 2px dashed #dee2e6;
    }
    
    .empty-products i {
        font-size: 80px;
        color: #6c757d;
        margin-bottom: 20px;
    }
    
    .empty-products h3 {
        color: #495057;
        margin-bottom: 10px;
        font-size: 24px;
    }
    
    .empty-products p {
        color: #6c757d;
        margin-bottom: 30px;
        max-width: 500px;
        margin-left: auto;
        margin-right: auto;
    }
    
    .reload-btn, .test-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 5px;
        font-size: 16px;
        cursor: pointer;
        margin: 5px;
        transition: all 0.3s;
    }
    
    .reload-btn {
        background-color: #007bff;
        color: white;
    }
    
    .test-btn {
        background-color: #6c757d;
        color: white;
    }
    
    .reload-btn:hover {
        background-color: #0056b3;
    }
    
    .test-btn:hover {
        background-color: #545b62;
    }
    
    .old-price {
        text-decoration: line-through;
        color: #999;
        margin-right: 10px;
    }
    
    .offer-price {
        color: #e74c3c;
        font-weight: bold;
        font-size: 1.2em;
    }
    
    .offer-badge {
        background: #e74c3c;
        color: white;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 12px;
        margin-left: 10px;
    }
    
    .no-price {
        color: #6c757d;
        font-style: italic;
    }
`;
document.head.appendChild(style);


// =============================================
// VARIABLES GLOBALES - AÑADIR NUEVAS
// =============================================
window.currentPage = 1;
window.productsPerPage = 8; // Productos por página
window.filteredProducts = []; // Productos filtrados por búsqueda
window.searchTerm = ''; // Término de búsqueda actual

// =============================================
// FUNCIÓN PARA RENDERIZAR PRODUCTOS CON PAGINACIÓN
// =============================================
function renderProducts() {
    console.log('🎨 RENDERIZANDO PRODUCTOS CON PAGINACIÓN...');

    const catalogGrid = document.getElementById('catalogGrid');
    const paginationControls = document.getElementById('paginationControls');
    const pageInfo = document.getElementById('pageInfo');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');

    if (!catalogGrid) {
        console.error('❌ No se encontró catalogGrid');
        return;
    }

    catalogGrid.innerHTML = '';

    // Usar productos filtrados si hay búsqueda, de lo contrario todos los productos
    const productsToDisplay = window.searchTerm ? window.filteredProducts : window.products;
    
    console.log(`📊 Total de productos: ${productsToDisplay?.length || 0}`);

    // Si no hay productos
    if (!productsToDisplay || productsToDisplay.length === 0) {
        catalogGrid.innerHTML = `
            <div class="empty-products">
                <i class="fas fa-search"></i>
                <h3>${window.searchTerm ? 'No se encontraron productos' : 'No hay productos disponibles'}</h3>
                <p>${window.searchTerm ? 'Intenta con otro término de búsqueda' : 'Prueba a recargar la página o contacta con el administrador.'}</p>
                ${window.searchTerm ? '<button onclick="clearSearch()" class="reload-btn"><i class="fas fa-times"></i> Limpiar búsqueda</button>' : ''}
            </div>
        `;
        
        // Ocultar controles de paginación si no hay productos
        if (paginationControls) {
            paginationControls.style.display = 'none';
        }
        return;
    }

    // Calcular índices para paginación
    const totalPages = Math.ceil(productsToDisplay.length / window.productsPerPage);
    const startIndex = (window.currentPage - 1) * window.productsPerPage;
    const endIndex = Math.min(startIndex + window.productsPerPage, productsToDisplay.length);
    const currentProducts = productsToDisplay.slice(startIndex, endIndex);

    console.log(`📄 Mostrando productos ${startIndex + 1}-${endIndex} de ${productsToDisplay.length}`);

    // Renderizar cada producto
    currentProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.setAttribute('data-id', product.id);
        productCard.style.cursor = 'pointer';

        // Determinar precio a mostrar
        let priceDisplay = '';
        if (product.price !== null) {
            if (product.is_offer && product.offer_price) {
                priceDisplay = `
                    <div class="product-price">
                        <span class="old-price">$${formatPrice(product.price)}</span>
                        <span class="offer-price">$${formatPrice(product.offer_price)}</span>
                        <span class="offer-badge">Oferta</span>
                    </div>
                `;
            } else {
                priceDisplay = `<div class="product-price">$${formatPrice(product.price)}</div>`;
            }
        } else {
            priceDisplay = '<div class="product-price no-price">Consultar precio</div>';
        }

        // Crear HTML del producto CON BOTÓN DE AGREGAR AL CARRITO
        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.name}" class="product-img" 
                    onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiNGNUY1RjUiLz48cGF0aCBkPSJNNjIgODRDNjIgNjkuNjQgNzMuNjQgNTggODggNThIMTEyQzEyNi4zNiA1OCAxMzggNjkuNjQgMTM4IDg0VjExNkMxMzggMTMwLjM2IDEyNi4zNiAxNDIgMTEyIDE0Mkg4OEM3My42NCAxNDIgNjIgMTMwLjM2IDYyIDExNlY4NFpNNDYgMTU2QzQ2IDE0NS41IDU0LjUgMTM3IDY1IDEzN0gxMzVMMTM2LjUgMTcwSDY1QzU0LjUgMTcwIDQ2IDE2MS41IDQ2IDE1MVYxNTZaIiBmaWxsPSIjQ0NDQ0NDIiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+'">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-desc">${product.description || ''}</p>
                ${product.details ? `<p class="product-details"><small>${product.details}</small></p>` : ''}
                ${priceDisplay}
                <div class="product-actions">
                    <button class="product-btn view-details-btn">
                        <i class="fas fa-eye"></i> Ver Detalles
                    </button>
                    <button class="product-btn add-to-cart-card-btn">
                        <i class="fas fa-shopping-cart"></i> Agregar al Carrito
                    </button>
                </div>
            </div>
        `;

        catalogGrid.appendChild(productCard);

        // Agregar eventos
        const viewDetailsBtn = productCard.querySelector('.view-details-btn');
        const addToCartBtn = productCard.querySelector('.add-to-cart-card-btn');

        // Evento para ver detalles
        viewDetailsBtn.addEventListener('click', function (event) {
            event.stopPropagation();
            viewProduct(product.id);
        });

        // Evento para agregar al carrito desde la tarjeta
        addToCartBtn.addEventListener('click', function (event) {
            event.stopPropagation();
            addToCartFromCard(product.id);
        });

        // Evento de clic en toda la tarjeta (excepto en botones)
        productCard.addEventListener('click', function (event) {
            if (!event.target.closest('.product-btn')) {
                viewProduct(product.id);
            }
        });
    });

    // Actualizar controles de paginación
    if (paginationControls && totalPages > 1) {
        paginationControls.style.display = 'flex';
        
        // Actualizar información de página
        if (pageInfo) {
            pageInfo.textContent = `Página ${window.currentPage} de ${totalPages} (${productsToDisplay.length} productos)`;
        }

        // Habilitar/deshabilitar botones
        if (prevPageBtn) {
            prevPageBtn.disabled = window.currentPage === 1;
            prevPageBtn.classList.toggle('disabled', window.currentPage === 1);
        }
        
        if (nextPageBtn) {
            nextPageBtn.disabled = window.currentPage === totalPages;
            nextPageBtn.classList.toggle('disabled', window.currentPage === totalPages);
        }
    } else {
        if (paginationControls) {
            paginationControls.style.display = 'none';
        }
    }

    console.log(`✅ ${currentProducts.length} productos renderizados (Página ${window.currentPage}/${totalPages})`);
}

// =============================================
// FUNCIÓN PARA AGREGAR AL CARRITO DESDE LA TARJETA
// =============================================
function addToCartFromCard(productId) {
    const product = window.products.find(p => p.id === productId);
    if (!product) {
        console.error('Producto no encontrado:', productId);
        showNotification('Producto no encontrado');
        return;
    }

    // Verificar si el producto ya está en el carrito (sin color específico)
    const existingItemIndex = window.cart.findIndex(item =>
        item.id === productId && !item.color
    );

    if (existingItemIndex >= 0) {
        // Actualizar cantidad si ya existe
        window.cart[existingItemIndex].quantity += 1;
    } else {
        // Agregar nuevo producto al carrito
        const productPrice = product.price !== null && product.price !== undefined ?
            product.price : null;

        window.cart.push({
            id: product.id,
            name: product.name,
            price: productPrice,
            image: product.image,
            quantity: 1,
            color: '' // Sin color específico desde la tarjeta
        });
    }

    // Actualizar carrito
    saveCart();
    updateCartCount();
    showNotification(`${product.name} agregado al carrito`);
}

// =============================================
// FUNCIONES DE PAGINACIÓN
// =============================================
function nextPage() {
    const productsToDisplay = window.searchTerm ? window.filteredProducts : window.products;
    const totalPages = Math.ceil(productsToDisplay.length / window.productsPerPage);
    
    if (window.currentPage < totalPages) {
        window.currentPage++;
        renderProducts();
        
        // Desplazar hacia arriba de la sección de catálogo
        const catalogSection = document.getElementById('catalogo');
        if (catalogSection) {
            window.scrollTo({
                top: catalogSection.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    }
}

function prevPage() {
    if (window.currentPage > 1) {
        window.currentPage--;
        renderProducts();
        
        // Desplazar hacia arriba de la sección de catálogo
        const catalogSection = document.getElementById('catalogo');
        if (catalogSection) {
            window.scrollTo({
                top: catalogSection.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    }
}

// =============================================
// FUNCIONES DE BÚSQUEDA
// =============================================
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    
    if (!searchInput) return;
    
    // Evento de entrada de búsqueda
    searchInput.addEventListener('input', function(e) {
        const term = e.target.value.trim().toLowerCase();
        window.searchTerm = term;
        
        // Mostrar/ocultar botón de limpiar
        if (clearSearchBtn) {
            clearSearchBtn.style.display = term ? 'flex' : 'none';
        }
        
        // Filtrar productos
        if (term) {
            window.filteredProducts = window.products.filter(product => {
                return (
                    product.name.toLowerCase().includes(term) ||
                    (product.description && product.description.toLowerCase().includes(term)) ||
                    (product.details && product.details.toLowerCase().includes(term))
                );
            });
            console.log(`🔍 Encontrados ${window.filteredProducts.length} productos para "${term}"`);
        } else {
            window.filteredProducts = [];
        }
        
        // Reiniciar a página 1
        window.currentPage = 1;
        
        // Renderizar productos
        renderProducts();
    });
    
    // Evento para limpiar búsqueda
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', clearSearch);
    }
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    
    if (searchInput) {
        searchInput.value = '';
        window.searchTerm = '';
        window.filteredProducts = [];
        window.currentPage = 1;
        
        if (clearSearchBtn) {
            clearSearchBtn.style.display = 'none';
        }
        
        renderProducts();
    }
}

// =============================================
// AGREGAR ESTILOS CSS AL FINAL DE app.js
// =============================================
// Agrega este CSS al final de app.js
const paginationStyles = document.createElement('style');
paginationStyles.textContent = `
    .search-container {
        max-width: 500px;
        margin: 0 auto 40px;
    }
    
    .search-box {
        position: relative;
        display: flex;
        align-items: center;
        background: white;
        border-radius: 10px;
        box-shadow: var(--shadow);
        padding: 10px 15px;
        border: 2px solid var(--primary-color);
    }
    
    .search-box i {
        color: var(--secondary-color);
        margin-right: 10px;
        font-size: 18px;
    }
    
    #searchInput {
        flex: 1;
        border: none;
        outline: none;
        font-size: 16px;
        padding: 8px 0;
        background: transparent;
    }
    
    .clear-search {
        background: none;
        border: none;
        color: #999;
        cursor: pointer;
        padding: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        width: 30px;
        height: 30px;
    }
    
    .clear-search:hover {
        background: #f5f5f5;
        color: #666;
    }
    
    .pagination-controls {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        margin-top: 40px;
        padding: 20px 0;
    }
    
    .pagination-btn {
        padding: 10px 20px;
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s;
    }
    
    .pagination-btn:hover:not(.disabled) {
        background-color: var(--secondary-color);
        transform: translateY(-2px);
    }
    
    .pagination-btn.disabled {
        background-color: #ccc;
        cursor: not-allowed;
        opacity: 0.6;
    }
    
    .page-info {
        font-size: 16px;
        color: #666;
        font-weight: 500;
    }
    
    .product-actions {
        display: flex;
        gap: 10px;
        margin-top: 15px;
    }
    
    .product-actions .product-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
    
    .add-to-cart-card-btn {
        background-color: var(--accent-color);
    }
    
    .add-to-cart-card-btn:hover {
        background-color: #e67e22;
    }
    
    @media (max-width: 768px) {
        .product-actions {
            flex-direction: column;
        }
        
        .pagination-controls {
            flex-direction: column;
            gap: 10px;
        }
        
        .pagination-btn {
            width: 100%;
            justify-content: center;
        }
    }
`;
document.head.appendChild(paginationStyles);