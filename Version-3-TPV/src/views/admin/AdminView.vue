<template>
  <div class="admin-shell">
    <header class="header">
      <div class="header-content">
        <p class="eyebrow">🔐 Panel de Control</p>
        <h1>Administración del Restaurante</h1>
        <p class="subtitle">Gestiona categorías, productos, mesas y usuarios</p>
        <p v-if="sessionExpiresAt" class="session-info">⏱️ Sesión expira: {{ formatSessionTime }}</p>
      </div>
      <button class="logout-btn" @click="handleLogout">
        <span>↪️ Cerrar sesión</span>
      </button>
    </header>

    <div class="stats">
      <div class="stat-box">
        <div class="stat-icon">📊</div>
        <div>
          <p class="stat-label">Total de Mesas</p>
          <p class="stat-value">{{ tables.length }}</p>
        </div>
      </div>
      <div class="stat-box">
        <div class="stat-icon">🍽️</div>
        <div>
          <p class="stat-label">Productos Activos</p>
          <p class="stat-value">{{ products.filter((item: any) => item.available).length }}</p>
        </div>
      </div>
      <div class="stat-box">
        <div class="stat-icon">⚠️</div>
        <div>
          <p class="stat-label">Agotados / Bajo stock</p>
          <p class="stat-value">{{ products.filter((item: any) => isProductOutOfStock(item) || isProductLowStock(item)).length }}</p>
        </div>
      </div>
      <div class="stat-box">
        <div class="stat-icon">🏷️</div>
        <div>
          <p class="stat-label">Categorías</p>
          <p class="stat-value">{{ categories.length }}</p>
        </div>
      </div>
      <div class="stat-box">
        <div class="stat-icon">👥</div>
        <div>
          <p class="stat-label">Usuarios del Sistema</p>
          <p class="stat-value">{{ users.length }}</p>
        </div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">🎯 Gestión Principal</h2>
      <div class="cards-grid">
        <div v-for="module in modules" :key="module.key" class="module-card" :class="module.key">
          <div class="module-icon">{{ module.icon }}</div>
          <div class="module-content">
            <h3>{{ module.title }}</h3>
            <p>{{ module.description }}</p>
          </div>
          <button class="module-btn" @click="selectModule(module.key)">{{ module.label }}</button>
        </div>
      </div>
    </div>

    <div v-if="selectedModule" class="section management-panel">
      <div class="panel-header">
        <h2>{{ currentModuleLabel }}</h2>
      </div>

      <div v-if="selectedModule === 'categories'" class="management-card">
        <div class="row product-create-form">
          <input v-model="newCategory" placeholder="Categoría en español" />
          <input v-model="newCategoryEn" placeholder="Category in English" />
          <button class="ghost-btn" @click="addCategory">Añadir</button>
        </div>
        <ul class="list">
          <li v-for="category in categories" :key="category.id" class="list-item">
            <div v-if="editingCategoryId === category.id" class="edit-row">
              <input v-model="editingCategoryName" placeholder="Categoría en español" class="edit-input" />
              <input v-model="editingCategoryNameEn" placeholder="Category in English" class="edit-input" />
              <button class="ghost-btn" @click="saveCategory(category.id)">Guardar</button>
              <button class="chip" @click="cancelEditCategory">Cancelar</button>
            </div>
            <div v-else class="flex-row">
              <span>{{ category.name }}<small v-if="category.nameEn"> · {{ category.nameEn }}</small></span>
              <div class="btn-group">
                <button class="chip" @click="startEditCategory(category.id, category.name, category.nameEn)">Editar</button>
                <button class="danger-btn" @click="removeCategory(category.id)">Eliminar</button>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <div v-else-if="selectedModule === 'products'" class="management-card">
        <div class="product-create-form">
          <div class="form-header">
            <h3>Crear nuevo producto</h3>
            <p>Completa los campos para dar de alta un plato, bebida o postre.</p>
          </div>

          <div class="form-grid">
            <label class="field-block">
              <span>Nombre</span>
              <input v-model="newProductName" placeholder="Ej: Paella de marisco" />
            </label>

            <label class="field-block">
              <span>Categoría</span>
              <select v-model="newProductCategory">
                <option value="" disabled selected>{{ categories.length ? 'Selecciona categoría' : 'Primero crea una categoría' }}</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
              </select>
            </label>

            <label class="field-block field-block-wide">
              <span>Descripción</span>
              <input v-model="newProductDescription" placeholder="Resumen del producto y su composición" />
            </label>

            <label class="field-block">
              <span>Precio</span>
              <input v-model.number="newProductPrice" type="number" min="0" step="0.1" placeholder="0.00" />
            </label>

            <label class="field-block">
              <span>Stock disponible</span>
              <input v-model.number="newProductStock" type="number" min="0" step="1" placeholder="0" />
            </label>

            <label class="field-block">
              <span>Alerta stock bajo</span>
              <input v-model.number="newProductLowStockThreshold" type="number" min="0" step="1" placeholder="5" />
            </label>

            <label class="field-block">
              <span>Nombre (EN)</span>
              <input v-model="newProductNameEn" placeholder="Seafood paella" />
            </label>

            <label class="field-block field-block-wide">
              <span>Descripción (EN)</span>
              <input v-model="newProductDescriptionEn" placeholder="English product description" />
            </label>

            <label class="field-block field-block-wide">
              <span>Imagen</span>
              <input v-model="newProductImage" placeholder="URL de la imagen del producto" />
              <select v-model="newProductImage" class="gallery-image-select" aria-label="Elegir imagen de la galería">
                <option value="">Elegir desde la galería...</option>
                <option v-for="image in galleryImages" :key="image.id" :value="image.url">{{ image.name }}</option>
              </select>
            </label>

            <div class="allergen-field field-block-wide">
              <label for="new-product-allergens">Alérgenos</label>
              <div class="allergen-picker">
                <select id="new-product-allergens" v-model="selectedAllergenToAdd">
                  <option v-for="allergen in availableNewAllergens" :key="allergen.value" :value="allergen.value">
                    {{ allergen.label }}
                  </option>
                </select>
                <button class="chip" type="button" @click="addSelectedAllergenToNewProduct">Añadir</button>
              </div>
              <div v-if="newProductAllergens.length" class="selected-allergens">
                <button
                  v-for="allergen in newProductAllergens"
                  :key="allergen"
                  type="button"
                  class="allergen-chip"
                  @click="removeAllergenFromNewProduct(allergen)"
                >
                  {{ allergenLabel(allergen) }} <span aria-hidden="true">×</span>
                </button>
              </div>
              <small v-else class="field-hint">No hay alérgenos seleccionados.</small>
            </div>
          </div>

          <div class="form-actions">
            <button class="ghost-btn" @click="addProduct">Añadir producto</button>
          </div>
        </div>
        <ul class="list">
          <li v-for="product in products" :key="product.id" class="list-item product-item">
            <div v-if="editingProductId === product.id" class="edit-product-form">
              <div class="form-header compact-header">
                <h3>Editar producto</h3>
              </div>

              <div class="form-grid">
                <label class="field-block">
                  <span>Nombre</span>
                  <input v-model="editingProduct.name" placeholder="Nombre del producto" class="edit-input" />
                </label>

                <label class="field-block">
                  <span>Categoría</span>
                  <select v-model="editingProduct.categoryId" class="edit-input">
                    <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                  </select>
                </label>

                <label class="field-block field-block-wide">
                  <span>Descripción</span>
                  <input v-model="editingProduct.description" placeholder="Descripción del producto" class="edit-input" />
                </label>

                <label class="field-block">
                  <span>Precio</span>
                  <input v-model.number="editingProduct.price" type="number" min="0" step="0.1" placeholder="Precio" class="edit-input" />
                </label>

                <label class="field-block">
                  <span>Stock</span>
                  <input v-model.number="editingProduct.stock" type="number" min="0" step="1" placeholder="Stock" class="edit-input" />
                </label>

                <label class="field-block">
                  <span>Alerta stock bajo</span>
                  <input v-model.number="editingProduct.lowStockThreshold" type="number" min="0" step="1" placeholder="Alerta stock bajo" class="edit-input" />
                </label>

                <label class="field-block">
                  <span>Nombre (EN)</span>
                  <input v-model="editingProduct.nameEn" placeholder="Product name in English" class="edit-input" />
                </label>

                <label class="field-block field-block-wide">
                  <span>Descripción (EN)</span>
                  <input v-model="editingProduct.descriptionEn" placeholder="Description in English" class="edit-input" />
                </label>

                <label class="field-block field-block-wide">
                  <span>Imagen</span>
                  <input v-model="editingProduct.image" placeholder="URL imagen del producto" class="edit-input" />
                  <select v-model="editingProduct.image" class="gallery-image-select" aria-label="Elegir imagen de la galería">
                    <option value="">Elegir desde la galería...</option>
                    <option v-for="image in galleryImages" :key="image.id" :value="image.url">{{ image.name }}</option>
                  </select>
                </label>

                <div class="allergen-field field-block-wide">
                  <label>Alérgenos</label>
                  <div class="allergen-picker">
                    <select v-model="selectedAllergenToAdd">
                      <option v-for="allergen in availableEditingAllergens" :key="allergen.value" :value="allergen.value">
                        {{ allergen.label }}
                      </option>
                    </select>
                    <button class="chip" type="button" @click="addSelectedAllergenToEditingProduct">Añadir</button>
                  </div>
                  <div v-if="editingProduct.allergens?.length" class="selected-allergens">
                    <button
                      v-for="allergen in editingProduct.allergens"
                      :key="allergen"
                      type="button"
                      class="allergen-chip"
                      @click="removeAllergenFromEditingProduct(allergen)"
                    >
                      {{ allergenLabel(allergen) }} <span aria-hidden="true">×</span>
                    </button>
                  </div>
                  <small v-else class="field-hint">No hay alérgenos seleccionados.</small>
                </div>
              </div>

              <div class="product-actions">
                <button class="ghost-btn" @click="saveProduct(product.id)">Guardar cambios</button>
                <button class="chip" @click="cancelEditProduct">Cancelar</button>
              </div>
            </div>
            <div v-else class="product-view">
              <div class="product-summary">
                <strong>{{ product.name }}</strong>
                <small v-if="product.description">{{ product.description }}</small>
                <small>{{ product.price.toFixed(2) }} €</small>
                <small :class="['stock-label', { danger: isProductOutOfStock(product), warning: hasStockWarning(product) }]">
                  {{ isProductOutOfStock(product) ? 'Agotado' : `Stock: ${Number(product.stock ?? 0)}` }}
                </small>
              </div>
              <div class="product-actions">
                <button class="chip" @click="startEditProduct(product)">Editar</button>
                <button class="chip" @click="toggleProductAvailability(product.id)">
                  {{ product.available ? 'Disponible' : 'Oculto' }}
                </button>
                <button class="danger-btn" @click="removeProduct(product.id)">Eliminar</button>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <div v-else-if="selectedModule === 'tables'" class="management-card">
        <div class="row">
          <input v-model.number="newTableNumber" type="number" min="1" placeholder="Número de mesa" />
          <button class="ghost-btn" @click="addTable">Crear mesa</button>
        </div>
        <ul class="list">
          <li v-for="table in tables" :key="table.id" class="list-item table-item">
            <span>Mesa {{ table.number }}</span>
            <div class="btn-group table-actions">
              <button class="chip" @click="openTable(table.qrIdentifier)">Ver mesa</button>
              <button class="chip" @click="downloadQr(table)">Descargar QR</button>
              <button class="chip" @click="toggleTableState(table.id)">
                {{ table.active ? 'Activa' : 'Libre' }}
              </button>
              <button class="danger-btn" @click="removeTable(table.id)">Eliminar</button>
            </div>
          </li>
        </ul>
      </div>

      <div v-else-if="selectedModule === 'payment-history'" class="management-card">
        <div class="history-panel admin-history-panel standalone">
          <div class="history-header">
            <h3>💰 Historial de pagos</h3>
            <select v-model="selectedPaidTableId" @change="paymentHistoryPage = 1">
              <option value="all">Todas las mesas</option>
              <option v-for="table in tables" :key="table.id" :value="table.id">Mesa {{ table.number }}</option>
            </select>
          </div>

          <div v-if="filteredPaidHistory.length" class="history-list">
            <div v-for="paidOrder in paginatedPaidHistory" :key="paidOrder.id" class="history-item payment-history-group">
              <div>
                <strong>Mesa {{ getTableLabel(paidOrder.tableId) }}</strong>
                <p>{{ paidOrder.orderCount }} {{ paidOrder.orderCount === 1 ? 'comanda' : 'comandas' }} agrupadas</p>
                <p>Entrada: {{ formatDateTime(paidOrder.createdAt) }}</p>
                <p>Salida: {{ formatDateTime(paidOrder.paidAt ?? paidOrder.updatedAt) }}</p>
                <p>Pago: {{ paidOrder.paymentMethod }}</p>
                <div class="payment-history-items">
                  <span v-for="item in paidOrder.items" :key="item.key" :class="{ rejected: item.rejected }">
                    {{ item.quantity }}× {{ item.name }} · {{ item.rejected ? 'NO COBRADO' : formatPrice(item.subtotal) }}
                  </span>
                </div>
              </div>
              <div class="history-item-actions">
                <span>{{ formatPrice(paidOrder.total) }}</span>
                <button class="chip" type="button" @click="downloadPaidOrderInvoice(paidOrder)">Descargar PDF</button>
              </div>
            </div>
          </div>
          <div v-else class="history-empty">No hay pagos registrados todavía.</div>

          <div v-if="filteredPaidHistory.length > 0" class="history-pagination">
            <button :disabled="!canPreviousPage" @click="previousPaymentPage" class="pagination-btn">← Anterior</button>
            <span class="pagination-info">Página {{ paymentHistoryPage }} de {{ paymentHistoryTotalPages }}</span>
            <button :disabled="!canNextPage" @click="nextPaymentPage" class="pagination-btn">Siguiente →</button>
          </div>
        </div>
      </div>

      <div v-else-if="selectedModule === 'cash-register'" class="management-card cash-register-panel">
        <div class="cash-register-header">
          <div><p class="stat-period">Control diario</p><h3>{{ currentCashRegister ? 'Caja abierta' : 'Caja cerrada' }}</h3></div>
          <span class="cash-status" :class="{ open: currentCashRegister }">{{ currentCashRegister ? 'ABIERTA' : 'CERRADA' }}</span>
        </div>
        <p v-if="cashFeedback" class="cash-feedback" :class="cashFeedbackType">{{ cashFeedback }}</p>
        <div class="cash-guide">
          <strong>Cómo funciona la caja</strong>
          <p><b>1. Abrir:</b> introduce el dinero que hay físicamente al comenzar el turno.</p>
          <p><b>2. Trabajar:</b> cada pedido cobrado se suma automáticamente a efectivo o tarjeta.</p>
          <p><b>3. Cerrar:</b> cuenta el efectivo real, escríbelo y pulsa «Cerrar caja».</p>
          <p><b>4. Revisar:</b> la diferencia muestra si sobra o falta dinero. Después puedes imprimir el informe y guardarlo como PDF.</p>
        </div>
        <div v-if="!currentCashRegister" class="cash-opening-form">
          <label>Importe inicial de caja (€)</label>
          <input v-model.number="openingAmount" type="number" min="0" step="0.01" placeholder="0,00" />
          <button class="ghost-btn" @click="openCashRegister">Abrir caja</button>
        </div>
        <template v-else>
          <div class="cash-summary-grid">
            <div class="cash-summary-card"><span>Importe inicial</span><strong>{{ formatPrice(currentCashRegister.openingAmount) }}</strong></div>
            <div class="cash-summary-card cash"><span>Ventas efectivo</span><strong>{{ formatPrice(cashRegisterCashTotal) }}</strong></div>
            <div class="cash-summary-card card-payment"><span>Ventas tarjeta</span><strong>{{ formatPrice(cashRegisterCardTotal) }}</strong></div>
            <div class="cash-summary-card total"><span>Total ventas</span><strong>{{ formatPrice(cashRegisterTotal) }}</strong></div>
          </div>
          <div class="cash-movements-section">
            <div class="cash-register-header"><div><p class="stat-period">Operativa diaria</p><h3>Movimientos de caja</h3></div><span class="cash-movement-balance">Neto: {{ formatPrice(cashMovementsBalance) }}</span></div>
            <div class="cash-movement-form">
              <input v-model="movementDescription" placeholder="Concepto: cambio, retirada, gasto..." />
              <select v-model="movementType"><option value="in">Entrada de efectivo</option><option value="out">Salida de efectivo</option></select>
              <input v-model.number="movementAmount" type="number" min="0" step="0.01" placeholder="Importe (€)" />
              <button class="chip" @click="addCashMovement">Registrar movimiento</button>
            </div>
            <div v-if="cashMovements.length" class="cash-movement-list">
              <div v-for="movement in cashMovements" :key="movement.id" class="cash-movement-row"><span>{{ movement.description }}</span><strong :class="movement.type">{{ movement.type === 'in' ? '+' : '-' }}{{ formatPrice(movement.amount) }}</strong></div>
            </div>
            <p v-else class="history-empty">No hay movimientos manuales en esta caja.</p>
          </div>
          <div class="cash-closing-form">
            <label>Dinero total contado en caja (€)</label>
            <input v-model.number="closingAmount" type="number" min="0" step="0.01" placeholder="0,00" />
            <p class="cash-calculation-note">Incluye el importe inicial, las ventas en efectivo y los movimientos manuales. Las ventas con tarjeta no están físicamente en la caja.</p>
            <p>Acumulado generado desde apertura: <strong class="cash-growth">+{{ formatPrice(cashGrowthSinceOpen) }}</strong></p>
            <p>Total esperado en caja: <strong>{{ formatPrice(expectedCashAtClose) }}</strong></p>
            <p>Inicial {{ formatPrice(currentCashRegister.openingAmount) }} + efectivo {{ formatPrice(cashRegisterCashTotal) }} + movimientos {{ formatPrice(cashMovementsBalance) }}</p>
            <p v-if="closingAmount !== null" class="cash-difference" :class="{ positive: cashDifference >= 0, negative: cashDifference < 0 }">Diferencia: <strong>{{ formatPrice(cashDifference) }}</strong></p>
            <p v-else class="cash-difference pending">Diferencia: <strong>Pendiente de contar</strong></p>
            <div class="cash-actions"><button class="ghost-btn" @click="closeCashRegister">Cerrar caja</button><button class="chip" @click="printCashReport">🖨️ Guardar informe PDF</button></div>
          </div>
        </template>
        <div class="cash-history">
          <div class="cash-register-header"><h3>Historial diario de cierres</h3><button v-if="cashClosures.length" class="chip" @click="printLatestCashReport">🖨️ PDF último cierre</button></div>
          <div v-if="cashClosures.length" class="history-list"><div v-for="closure in cashClosures" :key="closure.id" class="history-item"><div><strong>{{ formatDateTime(closure.closedAt) }}</strong><p>Mesas: {{ closure.activeTablesCount }} · Ventas: {{ formatPrice(closure.totalSales) }}</p></div><div class="history-item-actions"><span>{{ formatPrice(closure.difference) }}</span><button class="chip" type="button" @click="printCashClosureReport(closure)">🖨️ PDF</button></div></div></div>
          <div v-else class="history-empty">Todavía no hay cierres registrados.</div>
        </div>
      </div>

      <div v-else-if="selectedModule === 'data-management'" class="management-card data-management-panel">
        <div class="data-management-header">
          <div>
            <p class="stat-period">Exportación y mantenimiento</p>
            <h3>Gestión de datos</h3>
          </div>
          <span class="data-safety-note">Catálogo y empresa protegidos</span>
        </div>
        <p class="data-management-description">Descarga los resultados de un periodo con pedidos, pagos, caja, mesas, productos, categorías y configuración de empresa.</p>
        <div class="data-export-grid">
          <article class="data-export-card">
            <span class="data-export-icon">📅</span>
            <div><strong>Esta semana</strong><p>Actividad reciente de mesas, pagos y caja.</p></div>
            <button class="ghost-btn" type="button" @click="downloadDataExport('week')">Descargar semana</button>
          </article>
          <article class="data-export-card">
            <span class="data-export-icon">🗓️</span>
            <div><strong>Este mes</strong><p>Resumen mensual con el catálogo incluido.</p></div>
            <button class="ghost-btn" type="button" @click="downloadDataExport('month')">Descargar mes</button>
          </article>
          <article class="data-export-card">
            <span class="data-export-icon">📈</span>
            <div><strong>Este año</strong><p>Exportación anual completa para archivo.</p></div>
            <button class="ghost-btn" type="button" @click="downloadDataExport('year')">Descargar año</button>
          </article>
        </div>
        <div class="data-danger-zone">
          <strong>Limpiar resultados operativos</strong>
          <p>Elimina pedidos, pagos, sesiones y movimientos de caja, y libera las mesas. No elimina productos, categorías ni datos de empresa.</p>
          <button class="danger-btn" type="button" @click="clearOperationalData">Eliminar resultados operativos</button>
        </div>
      </div>

      <div v-else-if="selectedModule === 'statistics'" class="management-card stats-panel">
        <div class="stats-grid">
          <div class="stat-card">
            <p class="stat-period">Hoy</p>
            <p class="stat-amount">{{ formatPrice(todayTotal) }}</p>
          </div>
          <div class="stat-card">
            <p class="stat-period">Esta semana</p>
            <p class="stat-amount">{{ formatPrice(weekTotal) }}</p>
          </div>
          <div class="stat-card">
            <p class="stat-period">Este mes</p>
            <p class="stat-amount">{{ formatPrice(monthTotal) }}</p>
          </div>
          <div class="stat-card">
            <p class="stat-period">Este año</p>
            <p class="stat-amount">{{ formatPrice(yearTotal) }}</p>
          </div>
        </div>

        <div class="payment-stats-section">
          <div class="payment-stats-heading">
            <div>
              <p class="stat-period">Desglose por método de pago</p>
              <h3>Ventas cobradas</h3>
            </div>
            <span class="payment-stats-caption">Acumulado registrado</span>
          </div>
          <div class="payment-stats-grid">
            <div class="payment-stat-card cash">
              <span class="payment-stat-icon">💵</span>
              <div>
                <p>Efectivo</p>
                <strong>{{ formatPrice(cashTotal) }}</strong>
                <small>Hoy: {{ formatPrice(cashTodayTotal) }}</small>
              </div>
            </div>
            <div class="payment-stat-card card-payment">
              <span class="payment-stat-icon">💳</span>
              <div>
                <p>Tarjeta</p>
                <strong>{{ formatPrice(cardTotal) }}</strong>
                <small>Hoy: {{ formatPrice(cardTodayTotal) }}</small>
              </div>
            </div>
          </div>
        </div>
        
        <div class="tabs-container">
          <div class="tab-buttons">
            <button 
              @click="selectedChart = 'daily'"
              :class="['tab-btn', { active: selectedChart === 'daily' }]"
            >
              📊 Hoy
            </button>
            <button 
              @click="selectedChart = 'weekly'"
              :class="['tab-btn', { active: selectedChart === 'weekly' }]"
            >
              📅 Semana
            </button>
            <button 
              @click="selectedChart = 'monthly'"
              :class="['tab-btn', { active: selectedChart === 'monthly' }]"
            >
              🗓️ Mes
            </button>
            <button 
              @click="selectedChart = 'yearly'"
              :class="['tab-btn', { active: selectedChart === 'yearly' }]"
            >
              📈 Año
            </button>
          </div>

          <div class="chart-container full-width">
            <template v-if="selectedChart === 'daily'">
              <h3>Ingresos Hoy (00:00 - 23:00)</h3>
              <div v-if="dailyHourlyData.labels.length > 0" class="chart-wrapper">
                <canvas id="dailyChart" ref="dailyChartRef"></canvas>
              </div>
              <div v-else class="chart-empty">Sin datos disponibles</div>
            </template>

            <template v-else-if="selectedChart === 'weekly'">
              <h3>Ingresos Esta Semana (Lun - Dom)</h3>
              <div v-if="weeklyData.labels.length > 0" class="chart-wrapper">
                <canvas id="weeklyChart" ref="weeklyChartRef"></canvas>
              </div>
              <div v-else class="chart-empty">Sin datos disponibles</div>
            </template>

            <template v-else-if="selectedChart === 'monthly'">
              <h3>Ingresos Este Mes</h3>
              <div v-if="monthlyData.labels.length > 0" class="chart-wrapper">
                <canvas id="monthlyChart" ref="monthlyChartRef"></canvas>
              </div>
              <div v-else class="chart-empty">Sin datos disponibles</div>
            </template>

            <template v-else-if="selectedChart === 'yearly'">
              <h3>Ingresos Este Año (Ene - Dic)</h3>
              <div v-if="yearlyData.labels.length > 0" class="chart-wrapper">
                <canvas id="yearlyChart" ref="yearlyChartRef"></canvas>
              </div>
              <div v-else class="chart-empty">Sin datos disponibles</div>
            </template>
          </div>
        </div>
      </div>

      <div v-else-if="selectedModule === 'company'" class="management-card">
        <div class="company-settings-form">
          <div class="company-section-heading">
            <span>01</span>
            <div><h3>Identidad del restaurante</h3><p>La información principal que verá el cliente.</p></div>
          </div>
          <div class="field-group">
            <label>Nombre del restaurante</label>
            <input v-model="companyForm.restaurantName" placeholder="Ej: Le Petit Bistro" />
          </div>

          <div class="field-grid two-columns">
            <div class="company-section-heading company-section-heading-wide">
              <span>02</span>
              <div><h3>Datos fiscales</h3><p>Se utilizarán en las facturas.</p></div>
            </div>
            <div class="field-group">
              <label>Razón social para facturas</label>
              <input v-model="companyForm.legalName" placeholder="Ej: Le Petit Bistro S.L." />
            </div>
            <div class="field-group">
              <label>NIF / CIF</label>
              <input v-model="companyForm.taxId" placeholder="Ej: B12345678" />
            </div>
          </div>

          <div class="field-group">
            <div class="company-section-heading">
              <span>03</span>
              <div><h3>Contacto y ubicación</h3><p>Facilita al cliente cómo encontrarte y contactarte.</p></div>
            </div>
            <label>Dirección</label>
            <input v-model="companyForm.address" placeholder="Ej: Calle Mayor 123, Madrid" />
          </div>

          <div class="field-group">
            <label>Domicilio fiscal</label>
            <input v-model="companyForm.fiscalAddress" placeholder="Ej: Calle Mayor 123, 1º" />
          </div>

          <div class="field-grid three-columns">
            <div class="field-group">
              <label>Código postal</label>
              <input v-model="companyForm.postalCode" placeholder="Ej: 28001" />
            </div>
            <div class="field-group">
              <label>Localidad</label>
              <input v-model="companyForm.city" placeholder="Ej: Madrid" />
            </div>
            <div class="field-group">
              <label>País</label>
              <input v-model="companyForm.country" placeholder="Ej: España" />
            </div>
          </div>

          <div class="field-grid two-columns">
            <div class="field-group">
              <label>Teléfono</label>
              <input v-model="companyForm.phone" placeholder="Ej: +34 600 000 000" />
            </div>
            <div class="field-group">
              <label>Correo electrónico</label>
              <input v-model="companyForm.email" type="email" placeholder="Ej: hola@restaurante.com" />
            </div>
          </div>

          <div class="field-group">
            <label>Horario de apertura</label>
            <input v-model="companyForm.openingHours" placeholder="Ej: Lunes a Domingo · 12:00 - 00:00" />
          </div>

          <div class="field-grid two-columns">
            <div class="company-section-heading company-section-heading-wide">
              <span>04</span>
              <div><h3>Identidad visual</h3><p>Selecciona imágenes de la galería o pega una URL.</p></div>
            </div>
            <div class="field-block">
              <span>Logo del restaurante</span>
              <input v-model="companyForm.logoImage" placeholder="URL o ruta de imagen para el logo" />
              <select v-model="companyForm.logoImage" class="gallery-image-select" aria-label="Elegir logo desde la galería">
                <option value="">Elegir desde la galería...</option>
                <option v-for="image in galleryImages" :key="image.id" :value="image.url">{{ image.name }}</option>
              </select>
              <div v-if="companyForm.logoImage" class="company-image-preview logo-preview">
                <img :src="normalizeAdminImage(companyForm.logoImage)" alt="Vista previa del logo" />
                <button class="chip" type="button" @click="companyForm.logoImage = ''">Quitar selección</button>
              </div>
            </div>
            <div class="field-block">
              <span>Banner principal</span>
              <input v-model="companyForm.bannerImage" placeholder="URL o ruta de imagen para el banner" />
              <select v-model="companyForm.bannerImage" class="gallery-image-select" aria-label="Elegir banner desde la galería">
                <option value="">Elegir desde la galería...</option>
                <option v-for="image in galleryImages" :key="image.id" :value="image.url">{{ image.name }}</option>
              </select>
              <div v-if="companyForm.bannerImage" class="company-image-preview banner-preview">
                <img :src="normalizeAdminImage(companyForm.bannerImage)" alt="Vista previa del banner" />
                <button class="chip" type="button" @click="companyForm.bannerImage = ''">Quitar selección</button>
              </div>
            </div>
          </div>

          <div class="field-grid two-columns">
            <div class="company-section-heading company-section-heading-wide">
              <span>05</span>
              <div><h3>Redes sociales</h3><p>Conecta los perfiles públicos del restaurante.</p></div>
            </div>
            <div class="field-group">
              <label>Instagram</label>
              <input v-model="companyForm.instagram" placeholder="https://instagram.com/..." />
            </div>
            <div class="field-group">
              <label>Facebook</label>
              <input v-model="companyForm.facebook" placeholder="https://facebook.com/..." />
            </div>
          </div>

          <div class="field-group">
            <label>YouTube</label>
            <input v-model="companyForm.youtube" placeholder="https://youtube.com/@..." />
          </div>

          <div class="field-grid two-columns">
            <div class="field-group">
              <label>TikTok</label>
              <input v-model="companyForm.tiktok" placeholder="https://tiktok.com/@..." />
            </div>
            <div class="field-group">
              <label>WhatsApp</label>
              <input v-model="companyForm.whatsapp" placeholder="https://wa.me/..." />
            </div>
          </div>

          <div class="field-group">
            <label>Google Reviews</label>
            <input v-model="companyForm.googleReviews" placeholder="https://maps.google.com/..." />
          </div>

          <div class="form-actions">
            <button class="ghost-btn" @click="saveCompanyProfile">Guardar información</button>
          </div>
        </div>
      </div>

      <div v-else-if="selectedModule === 'gallery'" class="management-card gallery-admin-card">
        <div class="product-create-form">
          <div class="form-header">
            <h3>Biblioteca de imágenes</h3>
            <p>Sube imágenes una a una y reutiliza sus URLs en productos, banner o logo.</p>
          </div>
          <label class="upload-dropzone">
            <span>Seleccionar imagen</span>
            <small>JPG, PNG o WEBP · máximo 5 MB</small>
            <input type="file" accept="image/jpeg,image/png,image/webp" @change="uploadGalleryImage" />
          </label>
          <p v-if="galleryFeedback" class="field-hint">{{ galleryFeedback }}</p>
        </div>
        <div v-if="galleryImages.length" class="gallery-admin-grid">
          <article v-for="image in paginatedGalleryImages" :key="image.id" class="gallery-admin-item">
            <img :src="image.url" :alt="image.name" />
            <div class="gallery-admin-item-info">
              <strong>{{ image.name }}</strong>
              <div class="product-actions">
                <button class="chip" type="button" @click="copyGalleryUrl(image.url)">Copiar URL</button>
                <button v-if="image.storagePath" class="danger-btn" type="button" :disabled="galleryDeletingId === image.id" @click="removeGalleryImage(image)">
                  {{ galleryDeletingId === image.id ? 'Eliminando...' : 'Eliminar foto' }}
                </button>
              </div>
            </div>
          </article>
        </div>
        <p v-else class="history-empty">Todavía no hay imágenes disponibles.</p>
        <div v-if="galleryPageCount > 1" class="gallery-pagination">
          <button class="chip" type="button" :disabled="galleryPage === 1" @click="galleryPage--">Anterior</button>
          <span>Página {{ galleryPage }} de {{ galleryPageCount }}</span>
          <button class="chip" type="button" :disabled="galleryPage === galleryPageCount" @click="galleryPage++">Siguiente</button>
        </div>
      </div>

      <div v-else-if="selectedModule === 'suppliers'" class="management-card">
        <div class="supplier-form">
          <div class="form-header">
            <h3>Nuevo proveedor</h3>
            <p>Guarda quién suministra cada producto y dónde localizarlo.</p>
          </div>
          <div class="form-grid">
            <label class="field-block"><span>Empresa</span><input v-model="newSupplier.company" placeholder="Ej: Distribuciones García" /></label>
            <label class="field-block"><span>Qué vende</span><input v-model="newSupplier.products" placeholder="Ej: bebidas, carnes y congelados" /></label>
            <label class="field-block field-block-wide"><span>Dirección</span><input v-model="newSupplier.address" placeholder="Dirección física del proveedor" /></label>
            <label class="field-block field-block-wide"><span>Google Maps</span><input v-model="newSupplier.mapsUrl" type="url" placeholder="https://maps.google.com/..." /></label>
            <label class="field-block"><span>Teléfono</span><input v-model="newSupplier.phone" placeholder="+34..." /></label>
            <label class="field-block"><span>Correo</span><input v-model="newSupplier.email" type="email" placeholder="contacto@empresa.com" /></label>
          </div>
          <div class="form-actions"><button class="ghost-btn" type="button" @click="addSupplier">Guardar proveedor</button></div>
        </div>
        <div v-if="suppliers.length" class="supplier-list">
          <article v-for="supplier in suppliers" :key="supplier.id" class="supplier-card">
            <div>
              <strong>{{ supplier.company }}</strong>
              <p><b>Vende:</b> {{ supplier.products }}</p>
              <p><b>Dirección:</b> {{ supplier.address || 'Sin dirección' }}</p>
              <p v-if="supplier.phone || supplier.email">{{ supplier.phone }}{{ supplier.phone && supplier.email ? ' · ' : '' }}{{ supplier.email }}</p>
            </div>
            <div class="supplier-actions">
              <a v-if="supplier.mapsUrl" class="chip" :href="supplier.mapsUrl" target="_blank" rel="noopener noreferrer">Ver Maps</a>
              <button class="danger-btn" type="button" @click="removeSupplier(supplier.id)">Eliminar</button>
            </div>
          </article>
        </div>
        <p v-else class="history-empty">Todavía no hay proveedores registrados.</p>
      </div>

      <div v-else-if="selectedModule === 'users'" class="management-card">
        <ul class="list">
          <li v-for="user in users" :key="user.email" class="list-item">
            <span>{{ user.email }}</span>
            <button class="chip">{{ user.role }}</button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import QRCode from 'qrcode'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, LineController, Title, Tooltip, Legend, Filler } from 'chart.js'
import { db, storage } from '../../lib/firebase'
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { createDocument, deleteDocument, getCollectionSnapshot, getDocumentById, upsertDocument } from '../../services/firebase/firestore'
import { useAuthStore } from '../../stores/authStore'
import { useCompanySettings } from '../../stores/companySettings'
import { useOrdersLiveStore } from '../../stores/ordersLiveStore'
import { useTableSessionStore } from '../../stores/tableSessionStore'
import { deduplicateTables } from '../../services/tables/tables'
import { isProductLowStock, isProductOutOfStock } from '../../utils/productStock'
import { downloadInvoicePdf } from '../../utils/invoicePdf'
import { downloadDataExportPdf } from '../../utils/dataExportPdf'

// Register ChartJS components explicitly so the line chart controller is available.
ChartJS.register(
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const router = useRouter()
const { logout, user } = useAuthStore()
const { getPaidHistory, clearOrders, tables: storeTables } = useOrdersLiveStore()
const tableSessionStore = useTableSessionStore()
const { settings: companySettings, loadSettings: loadCompanySettings, saveSettings: saveCompanySettings } = useCompanySettings()

const canWriteAdminData = computed(() => !!user.value && user.value.role === 'admin')

const modules = [
  { key: 'categories', icon: '🏷️', title: 'Categorías', description: 'Organiza los productos por tipo.', label: 'Administrar Categorías' },
  { key: 'products', icon: '🍔', title: 'Productos', description: 'Crea y controla el menú del restaurante.', label: 'Administrar Productos' },
  { key: 'tables', icon: '🪑', title: 'Mesas', description: 'Activa o libera mesas del salón.', label: 'Administrar Mesas' },
  { key: 'users', icon: '👨‍💼', title: 'Usuarios', description: 'Gestiona roles del personal.', label: 'Administrar Usuarios' },
  { key: 'company', icon: '🏪', title: 'Empresa', description: 'Configura nombre, contacto y redes del restaurante.', label: 'Configurar Empresa' },
  { key: 'gallery', icon: '🖼️', title: 'Galería de imágenes', description: 'Sube, elimina y reutiliza imágenes del restaurante.', label: 'Administrar imágenes' },
  { key: 'suppliers', icon: '🚚', title: 'Proveedores', description: 'Consulta empresas, productos y ubicaciones de suministro.', label: 'Administrar Proveedores' },
  { key: 'payment-history', icon: '💰', title: 'Historial de Pagos', description: 'Visualiza el registro de todas las transacciones.', label: 'Ver Historial' },
  { key: 'cash-register', icon: '🧾', title: 'Caja', description: 'Abre, controla y cierra la caja diaria.', label: 'Gestionar Caja' },
  { key: 'data-management', icon: '🗄️', title: 'Gestión de datos', description: 'Exporta resultados y limpia la operativa con control.', label: 'Gestionar datos' },
  { key: 'statistics', icon: '📈', title: 'Estadísticas', description: 'Analiza ingresos y tendencias de ventas.', label: 'Ver Estadísticas' },
] as const

const categories = ref<any[]>([])
const products = ref<any[]>([])
const tables = ref<any[]>(storeTables.value ?? [])
const suppliers = ref<any[]>([])
const localGalleryImages = [
  { id: 'local-imagen1', name: 'imagen1.jpg', url: `${import.meta.env.DEV ? '/' : import.meta.env.BASE_URL}images/imagen1.jpg` },
  { id: 'local-banner-bar', name: 'banner-bar.jpeg', url: `${import.meta.env.DEV ? '/' : import.meta.env.BASE_URL}images/banner-bar.jpeg` },
  { id: 'local-logo-bar', name: 'logo-bar.png', url: `${import.meta.env.DEV ? '/' : import.meta.env.BASE_URL}images/logo-bar.png` },
  { id: 'local-icono-web', name: 'icono_web.png', url: `${import.meta.env.DEV ? '/' : import.meta.env.BASE_URL}images/icono_web.png` },
]
const galleryImages = ref<any[]>(localGalleryImages)
const galleryFeedback = ref('')
const galleryDeletingId = ref('')
const galleryPage = ref(1)
const galleryPageSize = 5
const galleryPageCount = computed(() => Math.max(1, Math.ceil(galleryImages.value.length / galleryPageSize)))
const paginatedGalleryImages = computed(() => {
  const start = (galleryPage.value - 1) * galleryPageSize
  return galleryImages.value.slice(start, start + galleryPageSize)
})

watch(galleryPageCount, (pageCount) => {
  galleryPage.value = Math.min(galleryPage.value, pageCount)
})

const users = ref([
  { email: 'admin@restaurante.com', role: 'admin' },
  { email: 'cocina@restaurante.com', role: 'kitchen' },
  { email: 'camarero@restaurante.com', role: 'waiter' },
])

const hydrateAdminData = async () => {
  if (!db) return

  try {
    const [categorySnapshots, productSnapshots, tableSnapshots, supplierSnapshots, gallerySnapshots] = await Promise.all([
      getCollectionSnapshot<any>('categories'),
      getCollectionSnapshot<any>('products'),
      getCollectionSnapshot<any>('tables'),
      getCollectionSnapshot<any>('suppliers'),
      getCollectionSnapshot<any>('galleryImages'),
    ])

    if (categorySnapshots.length) {
      categories.value = categorySnapshots
    }
    if (productSnapshots.length) {
      products.value = productSnapshots
    }
    suppliers.value = supplierSnapshots
    galleryImages.value = [...localGalleryImages, ...gallerySnapshots]
    if (tableSnapshots.length) {
      const uniqueTables = deduplicateTables(tableSnapshots)
      const uniqueIds = new Set(uniqueTables.map((table) => table.id))
      const duplicateTables = tableSnapshots.filter((table) => !uniqueIds.has(table.id))

      tables.value = uniqueTables

      if (canWriteAdminData.value && duplicateTables.length) {
        await Promise.all(duplicateTables.map((table) => deleteDocument('tables', table.id)))
      }

      const tablesToFree = uniqueTables.filter((table) => table.active && !table.currentSessionId)
      if (tablesToFree.length) {
        await Promise.all(tablesToFree.map((table) => upsertDocument('tables', table.id, {
          ...table,
          active: false,
        })))
        tables.value = uniqueTables.map((table) =>
          table.active && !table.currentSessionId ? { ...table, active: false } : table,
        )
      }
    }
  } catch (error) {
    console.warn('No se pudieron cargar los datos del panel admin desde Firestore.', error)
  }
}

watch(categories, async () => {
  // Stored only in Firebase; localStorage is not used for business data.
}, { deep: true })

watch(products, async () => {
  // Stored only in Firebase; localStorage is not used for business data.
}, { deep: true })

watch(tables, async () => {
  // Stored only in Firebase; localStorage is not used for business data.
}, { deep: true })

onMounted(async () => {
  // Load from Firebase first, before anything else
  await Promise.all([
    hydrateAdminData(),
    loadCompanySettings(),
    loadCashRegister(),
  ])
})

const selectedModule = ref<'categories' | 'products' | 'tables' | 'users' | 'company' | 'gallery' | 'suppliers' | 'payment-history' | 'cash-register' | 'data-management' | 'statistics'>('tables')
const selectedChart = ref<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily')
const companyForm = ref({
  restaurantName: '',
  legalName: '',
  taxId: '',
  address: '',
  fiscalAddress: '',
  postalCode: '',
  city: '',
  country: '',
  phone: '',
  email: '',
  openingHours: '',
  logoImage: '',
  bannerImage: '',
  tiktok: '',
  whatsapp: '',
  instagram: '',
  facebook: '',
  youtube: '',
  googleReviews: '',
})

watch(
  () => companySettings.value,
  (settings) => {
    companyForm.value = {
      restaurantName: settings.restaurantName || '',
      legalName: settings.legalName || '',
      taxId: settings.taxId || '',
      address: settings.address || '',
      fiscalAddress: settings.fiscalAddress || '',
      postalCode: settings.postalCode || '',
      city: settings.city || '',
      country: settings.country || '',
      phone: settings.phone || '',
      email: settings.email || '',
      openingHours: settings.openingHours || '',
      logoImage: settings.logoImage || '',
      bannerImage: settings.bannerImage || '',
      tiktok: settings.socials?.tiktok || '',
      whatsapp: settings.socials?.whatsapp || '',
      instagram: settings.socials?.instagram || '',
      facebook: settings.socials?.facebook || '',
      youtube: settings.socials?.youtube || '',
      googleReviews: settings.socials?.googleReviews || '',
    }
  },
  { deep: true, immediate: true },
)

const saveCompanyProfile = async () => {
  try {
    await saveCompanySettings({
      restaurantName: companyForm.value.restaurantName.trim(),
      legalName: companyForm.value.legalName.trim(),
      taxId: companyForm.value.taxId.trim().toUpperCase(),
      address: companyForm.value.address.trim(),
      fiscalAddress: companyForm.value.fiscalAddress.trim(),
      postalCode: companyForm.value.postalCode.trim(),
      city: companyForm.value.city.trim(),
      country: companyForm.value.country.trim(),
      phone: companyForm.value.phone.trim(),
      email: companyForm.value.email.trim(),
      openingHours: companyForm.value.openingHours.trim(),
      logoImage: companyForm.value.logoImage.trim(),
      bannerImage: companyForm.value.bannerImage.trim(),
      socials: {
        tiktok: companyForm.value.tiktok.trim(),
        whatsapp: companyForm.value.whatsapp.trim(),
        instagram: companyForm.value.instagram.trim(),
        facebook: companyForm.value.facebook.trim(),
        youtube: companyForm.value.youtube.trim(),
        googleReviews: companyForm.value.googleReviews.trim(),
      },
    })
  } catch (error) {
    console.error('No se pudo guardar la información del restaurante.', error)
  }
}

const allergenOptions = [
  { label: 'Gluten', value: 'gluten' },
  { label: 'Huevos', value: 'huevos' },
  { label: 'Lácteos', value: 'lacteos' },
  { label: 'Soja', value: 'soja' },
  { label: 'Crustáceos', value: 'crustaceos' },
  { label: 'Moluscos', value: 'moluscos' },
  { label: 'Pescado', value: 'pescado' },
  { label: 'Sésamo', value: 'sesamo' },
  { label: 'Frutos secos', value: 'frutos' },
  { label: 'Cacahuetes', value: 'cacahuetes' },
  { label: 'Altramuces', value: 'altramuces' },
  { label: 'Apio', value: 'apio' },
  { label: 'Mostaza', value: 'mostaza' },
  { label: 'Sulfitos', value: 'sulfitos' },
]

const selectedAllergenToAdd = ref(allergenOptions[0].value)

const allergenLabel = (value: string) =>
  allergenOptions.find((option) => option.value === value)?.label || value

const availableNewAllergens = computed(() =>
  allergenOptions.filter((option) => !newProductAllergens.value.includes(option.value)),
)

const availableEditingAllergens = computed(() => {
  const selected = Array.isArray(editingProduct.value.allergens) ? editingProduct.value.allergens : []
  return allergenOptions.filter((option) => !selected.includes(option.value))
})

const newCategory = ref('')
const newCategoryEn = ref('')
const newProductName = ref('')
const newProductDescription = ref('')
const newProductNameEn = ref('')
const newProductDescriptionEn = ref('')
const newProductCategory = ref('drinks')
const newProductPrice = ref(0)
const newProductStock = ref(100)
const newProductLowStockThreshold = ref(5)
const newProductImage = ref('')
const newProductAllergens = ref<string[]>([])
const newSupplier = ref({ company: '', products: '', address: '', mapsUrl: '', phone: '', email: '' })

const addSupplier = async () => {
  if (!canWriteAdminData.value || !newSupplier.value.company.trim() || !newSupplier.value.products.trim()) return

  const supplier = {
    id: `supplier-${Date.now()}`,
    company: newSupplier.value.company.trim(),
    products: newSupplier.value.products.trim(),
    address: newSupplier.value.address.trim(),
    mapsUrl: newSupplier.value.mapsUrl.trim(),
    phone: newSupplier.value.phone.trim(),
    email: newSupplier.value.email.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  try {
    await createDocument('suppliers', supplier)
    suppliers.value = [supplier, ...suppliers.value]
    newSupplier.value = { company: '', products: '', address: '', mapsUrl: '', phone: '', email: '' }
  } catch (error) {
    console.error('No se pudo guardar el proveedor.', error)
  }
}

const removeSupplier = async (supplierId: string) => {
  if (!canWriteAdminData.value) return
  if (!window.confirm('¿Eliminar este proveedor?')) return

  try {
    await deleteDocument('suppliers', supplierId)
    suppliers.value = suppliers.value.filter((supplier) => supplier.id !== supplierId)
  } catch (error) {
    console.error('No se pudo eliminar el proveedor.', error)
  }
}

const hasStockWarning = (product: any) => isProductLowStock(product) && !isProductOutOfStock(product)
const newTableNumber = ref<number | null>(null)
const selectedPaidTableId = ref<string | 'all'>('all')
const paymentHistoryPage = ref(1)
const paymentHistoryPageSize = 3
const paidHistory = computed(() => getPaidHistory())

const groupedPaidHistory = computed(() => {
  const groups = new Map<string, any>()
  paidHistory.value.forEach((order) => {
    const key = `${order.tableId}-${order.sessionId}-${order.paidAt ?? order.updatedAt}-${order.paymentMethod ?? 'efectivo'}`
    const group = groups.get(key)
    const orderItems = order.items.map((item: any, index: number) => ({
      key: `${order.id}-${index}`,
      name: item.name,
      quantity: item.quantity,
      subtotal: item.status === 'REJECTED' ? 0 : item.subtotal,
      rejected: item.status === 'REJECTED',
      rejectionReason: item.rejectionReason,
    }))

    if (group) {
      group.orderCount += 1
      group.total += order.total
      group.items.push(...orderItems)
    } else {
      groups.set(key, {
        ...order,
        id: `payment-group-${key}`,
        orderCount: 1,
        items: orderItems,
      })
    }
  })
  return [...groups.values()].sort((left, right) =>
    new Date(right.paidAt ?? right.updatedAt).getTime() - new Date(left.paidAt ?? left.updatedAt).getTime(),
  )
})

const downloadPaidOrderInvoice = (order: any) => {
  downloadInvoicePdf({
    tableNumber: getTableLabel(order.tableId),
    items: order.items,
    total: order.total,
    paymentMethod: order.paymentMethod ?? 'efectivo',
    splitCount: order.paymentSplitCount ?? 1,
    paidAt: order.paidAt ?? order.updatedAt,
    company: companySettings.value,
  })
}
const currentCashRegister = ref<any | null>(null)
const cashClosures = ref<any[]>([])
const openingAmount = ref(0)
const closingAmount = ref<number | null>(null)
const cashMovements = ref<any[]>([])
const movementDescription = ref('')
const movementType = ref<'in' | 'out'>('in')
const movementAmount = ref(0)
const cashFeedback = ref('')
const cashFeedbackType = ref<'success' | 'error'>('success')

const loadCashRegister = async () => {
  if (!db) return
  currentCashRegister.value = await getDocumentById<any>('cashRegisters', 'current')
  cashClosures.value = (await getCollectionSnapshot<any>('cashClosures'))
    .sort((left, right) => new Date(right.closedAt).getTime() - new Date(left.closedAt).getTime())
  const movements = await getCollectionSnapshot<any>('cashMovements')
  cashMovements.value = currentCashRegister.value
    ? movements.filter((movement) => movement.registerId === currentCashRegister.value.id)
    : []
}

const cashRegisterOrders = computed(() => {
  if (!currentCashRegister.value) return []
  const openedAt = new Date(currentCashRegister.value.openedAt).getTime()
  return paidHistory.value.filter((order) => new Date(order.paidAt ?? order.updatedAt).getTime() >= openedAt)
})
const cashRegisterCashTotal = computed(() => cashRegisterOrders.value.filter((order) => order.paymentMethod !== 'tarjeta').reduce((sum, order) => sum + order.total, 0))
const cashRegisterCardTotal = computed(() => cashRegisterOrders.value.filter((order) => order.paymentMethod === 'tarjeta').reduce((sum, order) => sum + order.total, 0))
const cashRegisterTotal = computed(() => cashRegisterCashTotal.value + cashRegisterCardTotal.value)
const cashMovementsIn = computed(() => cashMovements.value.filter((movement) => movement.type === 'in').reduce((sum, movement) => sum + Number(movement.amount || 0), 0))
const cashMovementsOut = computed(() => cashMovements.value.filter((movement) => movement.type === 'out').reduce((sum, movement) => sum + Number(movement.amount || 0), 0))
const cashMovementsBalance = computed(() => cashMovementsIn.value - cashMovementsOut.value)
const expectedCashAtClose = computed(() => Number(currentCashRegister.value?.openingAmount || 0) + cashRegisterCashTotal.value + cashMovementsBalance.value)
const cashGrowthSinceOpen = computed(() => cashRegisterCashTotal.value + cashMovementsBalance.value)
const cashDifference = computed(() => Number(closingAmount.value ?? 0) - expectedCashAtClose.value)
const filteredPaidHistory = computed(() => {
  if (selectedPaidTableId.value === 'all') return groupedPaidHistory.value
  return groupedPaidHistory.value.filter((order) => order.tableId === selectedPaidTableId.value)
})
const paginatedPaidHistory = computed(() => {
  const start = (paymentHistoryPage.value - 1) * paymentHistoryPageSize
  const end = start + paymentHistoryPageSize
  return filteredPaidHistory.value.slice(start, end)
})
const paymentHistoryTotalPages = computed(() => {
  return Math.ceil(filteredPaidHistory.value.length / paymentHistoryPageSize)
})
const canPreviousPage = computed(() => paymentHistoryPage.value > 1)
const canNextPage = computed(() => paymentHistoryPage.value < paymentHistoryTotalPages.value)
const previousPaymentPage = () => {
  if (canPreviousPage.value) paymentHistoryPage.value--
}
const nextPaymentPage = () => {
  if (canNextPage.value) paymentHistoryPage.value++
}

// Statistics
const dailyChartRef = ref<any>(null)
const weeklyChartRef = ref<any>(null)
const monthlyChartRef = ref<any>(null)
const yearlyChartRef = ref<any>(null)
let dailyChartInstance: any = null
let weeklyChartInstance: any = null
let monthlyChartInstance: any = null
let yearlyChartInstance: any = null

// Daily data (full 24-hour timeline: 00:00 to 23:00)
const dailyHourlyData = computed(() => {
  const labels: string[] = []
  const data: number[] = []
  const hourlyTotals: { [key: number]: number } = {}

  for (let hour = 0; hour < 24; hour++) {
    hourlyTotals[hour] = 0
    const displayHour = hour < 10 ? `0${hour}:00` : `${hour}:00`
    labels.push(displayHour)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  paidHistory.value.forEach(order => {
    const paidDate = new Date(order.paidAt ?? order.updatedAt)
    if (paidDate >= today && paidDate < tomorrow) {
      const hour = paidDate.getHours()
      if (hour in hourlyTotals) {
        hourlyTotals[hour] += order.total || 0
      }
    }
  })

  for (let hour = 0; hour < 24; hour++) {
    data.push(hourlyTotals[hour])
  }

  return { labels, data }
})

// Weekly data (by day of week: Mon - Sun)
const weeklyData = computed(() => {
  const labels = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  const data: number[] = [0, 0, 0, 0, 0, 0, 0]
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Monday
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 7)
  
  paidHistory.value.forEach(order => {
    const paidDate = new Date(order.paidAt ?? order.updatedAt)
    paidDate.setHours(0, 0, 0, 0)
    if (paidDate >= startOfWeek && paidDate < endOfWeek) {
      const dayOfWeek = paidDate.getDay() === 0 ? 6 : paidDate.getDay() - 1 // Convert Sunday to 6
      data[dayOfWeek] += order.total || 0
    }
  })
  
  return { labels, data }
})

// Monthly data (by day of month)
const monthlyData = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  
  const labels: string[] = []
  const data: number[] = []
  const dailyTotals: { [key: number]: number } = {}
  
  // Initialize all days
  for (let day = 1; day <= daysInMonth; day++) {
    dailyTotals[day] = 0
    labels.push(`${day}`)
  }
  
  // Aggregate by day
  paidHistory.value.forEach(order => {
    const paidDate = new Date(order.paidAt ?? order.updatedAt)
    if (paidDate.getFullYear() === year && paidDate.getMonth() === month) {
      const day = paidDate.getDate()
      if (day in dailyTotals) {
        dailyTotals[day] += order.total || 0
      }
    }
  })
  
  // Push all days
  for (let day = 1; day <= daysInMonth; day++) {
    data.push(dailyTotals[day])
  }
  
  return { labels, data }
})

// Yearly data (by month)
const yearlyData = computed(() => {
  const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const data: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  const currentYear = new Date().getFullYear()
  
  paidHistory.value.forEach(order => {
    const paidDate = new Date(order.paidAt ?? order.updatedAt)
    if (paidDate.getFullYear() === currentYear) {
      const month = paidDate.getMonth()
      data[month] += order.total || 0
    }
  })
  
  return { labels, data }
})

const createLineChart = (ctx: any, labels: string[], data: number[]): any => {
  try {
    return new ChartJS(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Ingresos (€)',
            data,
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.15)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#f97316',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            display: true,
            labels: {
              color: 'rgba(255, 255, 255, 0.8)',
              font: { size: 12, weight: 'bold' as any },
              padding: 15,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              callback: (value: any) => '€' + value.toFixed(0),
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
          },
          x: {
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: { size: 10 } as any,
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
          },
        },
      },
    })
  } catch (error) {
    console.error('Error creating chart:', error)
    return null
  }
}

const updateAllCharts = async () => {
  if (selectedModule.value !== 'statistics') return
  
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 50))
  
  try {
    // Solo actualizar el gráfico seleccionado
    if (selectedChart.value === 'daily') {
      const canvas = dailyChartRef.value as HTMLCanvasElement | null
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          if (dailyChartInstance) {
            dailyChartInstance.destroy()
            dailyChartInstance = null
          }
          dailyChartInstance = createLineChart(ctx, dailyHourlyData.value.labels, dailyHourlyData.value.data)
        }
      }
    } else if (selectedChart.value === 'weekly') {
      const canvas = weeklyChartRef.value as HTMLCanvasElement | null
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          if (weeklyChartInstance) {
            weeklyChartInstance.destroy()
            weeklyChartInstance = null
          }
          weeklyChartInstance = createLineChart(ctx, weeklyData.value.labels, weeklyData.value.data)
        }
      }
    } else if (selectedChart.value === 'monthly') {
      const canvas = monthlyChartRef.value as HTMLCanvasElement | null
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          if (monthlyChartInstance) {
            monthlyChartInstance.destroy()
            monthlyChartInstance = null
          }
          monthlyChartInstance = createLineChart(ctx, monthlyData.value.labels, monthlyData.value.data)
        }
      }
    } else if (selectedChart.value === 'yearly') {
      const canvas = yearlyChartRef.value as HTMLCanvasElement | null
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          if (yearlyChartInstance) {
            yearlyChartInstance.destroy()
            yearlyChartInstance = null
          }
          yearlyChartInstance = createLineChart(ctx, yearlyData.value.labels, yearlyData.value.data)
        }
      }
    }
  } catch (error) {
    console.error('Error en updateAllCharts:', error)
  }
}

watch(selectedModule, async () => {
  if (selectedModule.value === 'statistics') {
    await updateAllCharts()
  }
})

watch(selectedChart, async () => {
  if (selectedModule.value === 'statistics') {
    await updateAllCharts()
  }
})

watch(() => paidHistory.value.length, async () => {
  if (selectedModule.value === 'statistics') {
    await updateAllCharts()
  }
}, { deep: true })

const todayTotal = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  return paidHistory.value
    .filter(order => {
      const paidDate = new Date(order.paidAt ?? order.updatedAt)
      return paidDate >= today && paidDate < tomorrow
    })
    .reduce((sum, order) => sum + (order.total || 0), 0)
})

const weekTotal = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Monday
  
  return paidHistory.value
    .filter(order => {
      const paidDate = new Date(order.paidAt ?? order.updatedAt)
      paidDate.setHours(0, 0, 0, 0)
      return paidDate >= startOfWeek && paidDate <= today
    })
    .reduce((sum, order) => sum + (order.total || 0), 0)
})

const monthTotal = computed(() => {
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  
  return paidHistory.value
    .filter(order => {
      const paidDate = new Date(order.paidAt ?? order.updatedAt)
      return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear
    })
    .reduce((sum, order) => sum + (order.total || 0), 0)
})

const yearTotal = computed(() => {
  const currentYear = new Date().getFullYear()
  
  return paidHistory.value
    .filter(order => {
      const paidDate = new Date(order.paidAt ?? order.updatedAt)
      return paidDate.getFullYear() === currentYear
    })
    .reduce((sum, order) => sum + (order.total || 0), 0)
})

const cashTotal = computed(() => paidHistory.value
  .filter((order) => order.paymentMethod !== 'tarjeta')
  .reduce((sum, order) => sum + (order.total || 0), 0))

const cardTotal = computed(() => paidHistory.value
  .filter((order) => order.paymentMethod === 'tarjeta')
  .reduce((sum, order) => sum + (order.total || 0), 0))

const cashTodayTotal = computed(() => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return paidHistory.value
    .filter((order) => order.paymentMethod !== 'tarjeta')
    .filter((order) => {
      const paidDate = new Date(order.paidAt ?? order.updatedAt)
      return paidDate >= start && paidDate < end
    })
    .reduce((sum, order) => sum + (order.total || 0), 0)
})

const cardTodayTotal = computed(() => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return paidHistory.value
    .filter((order) => order.paymentMethod === 'tarjeta')
    .filter((order) => {
      const paidDate = new Date(order.paidAt ?? order.updatedAt)
      return paidDate >= start && paidDate < end
    })
    .reduce((sum, order) => sum + (order.total || 0), 0)
})

const selectModule = (key: 'categories' | 'products' | 'tables' | 'users' | 'company' | 'gallery' | 'suppliers' | 'payment-history' | 'cash-register' | 'data-management' | 'statistics') => {
  selectedModule.value = key
}

const normalizeAdminImage = (value: string) => {
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  if (value.startsWith(import.meta.env.BASE_URL)) return value
  const publicBase = import.meta.env.DEV ? '/' : import.meta.env.BASE_URL
  return `${publicBase}${value.replace(/^\.\//, '').replace(/^\//, '')}`
}

const uploadGalleryImage = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  galleryFeedback.value = ''

  if (!file) return
  if (!storage || !db) {
    galleryFeedback.value = 'Firebase Storage no está disponible.'
    return
  }
  if (!file.type.startsWith('image/')) {
    galleryFeedback.value = 'Selecciona un archivo de imagen.'
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    galleryFeedback.value = 'La imagen no puede superar los 5 MB.'
    return
  }

  try {
    galleryFeedback.value = 'Subiendo imagen...'
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, '-')
    const storagePath = `images/galeria/${Date.now()}-${safeName}`
    const imageRef = storageRef(storage, storagePath)
    await uploadBytes(imageRef, file, { contentType: file.type })
    const url = await getDownloadURL(imageRef)
    const image = { name: file.name, url, storagePath, createdAt: new Date().toISOString() }
    await upsertDocument('galleryImages', storagePath.replace(/[^a-zA-Z0-9-]/g, '-'), image)
    galleryImages.value = [...galleryImages.value, { ...image, id: storagePath.replace(/[^a-zA-Z0-9-]/g, '-') }]
    galleryFeedback.value = 'Imagen añadida correctamente.'
  } catch (error) {
    console.error('No se pudo subir la imagen de galería.', error)
    galleryFeedback.value = 'No se pudo subir la imagen.'
  }
}

const copyGalleryUrl = async (url: string) => {
  await navigator.clipboard?.writeText(url)
  galleryFeedback.value = 'URL copiada. Puedes pegarla en cualquier campo de imagen.'
}

const removeGalleryImage = async (image: any) => {
  if (!db || !storage || !image?.storagePath) return
  if (!window.confirm(`¿Quieres eliminar la foto "${image.name}"? Esta acción no se puede deshacer.`)) return

  try {
    galleryDeletingId.value = image.id
    try {
      await deleteObject(storageRef(storage, image.storagePath))
    } catch (error: any) {
      if (error?.code !== 'storage/object-not-found') throw error
    }
    await deleteDocument('galleryImages', image.id)
    galleryImages.value = galleryImages.value.filter((item) => item.id !== image.id)
    galleryFeedback.value = 'Imagen eliminada.'
  } catch (error) {
    console.error('No se pudo eliminar la imagen de galería.', error)
    galleryFeedback.value = 'No se pudo eliminar la imagen.'
  } finally {
    galleryDeletingId.value = ''
  }
}

const cashRegisterActiveTables = computed(() => new Set(cashRegisterOrders.value.map((order) => order.tableId)).size)

const openCashRegister = async () => {
  if (!canWriteAdminData.value || currentCashRegister.value) return

  const openedAt = new Date().toISOString()
  const register = {
    id: 'current',
    openingAmount: Math.max(0, Number(openingAmount.value) || 0),
    openedAt,
    openedBy: user.value?.email || 'admin',
  }

  try {
    await upsertDocument('cashRegisters', 'current', register)
    currentCashRegister.value = register
    closingAmount.value = null
    cashFeedbackType.value = 'success'
    cashFeedback.value = 'Caja abierta correctamente.'
  } catch (error) {
    cashFeedbackType.value = 'error'
    cashFeedback.value = 'No se pudo abrir la caja. Revisa que las reglas de Firestore estén desplegadas.'
    console.error('No se pudo abrir la caja.', error)
  }
}

const addCashMovement = async () => {
  const description = movementDescription.value.trim()
  const amount = Math.max(0, Number(movementAmount.value) || 0)
  if (!currentCashRegister.value || !description || amount <= 0 || !canWriteAdminData.value) return

  const movement = {
    id: `movement-${Date.now()}`,
    registerId: currentCashRegister.value.id,
    type: movementType.value,
    description,
    amount,
    createdAt: new Date().toISOString(),
    createdBy: user.value?.email || 'admin',
  }

  try {
    await createDocument('cashMovements', movement)
    cashMovements.value = [movement, ...cashMovements.value]
    movementDescription.value = ''
    movementAmount.value = 0
    cashFeedbackType.value = 'success'
    cashFeedback.value = 'Movimiento registrado.'
  } catch (error) {
    cashFeedbackType.value = 'error'
    cashFeedback.value = 'No se pudo registrar el movimiento en Firestore.'
    console.error('No se pudo registrar el movimiento de caja.', error)
  }
}

const closeCashRegister = async () => {
  if (!canWriteAdminData.value || !currentCashRegister.value) return

  const closedAt = new Date().toISOString()
  const closure = {
    id: `closure-${Date.now()}`,
    openedAt: currentCashRegister.value.openedAt,
    closedAt,
    openingAmount: Number(currentCashRegister.value.openingAmount) || 0,
    cashSales: cashRegisterCashTotal.value,
    cardSales: cashRegisterCardTotal.value,
    totalSales: cashRegisterTotal.value,
    countedCash: Math.max(0, Number(closingAmount.value) || 0),
    expectedCash: expectedCashAtClose.value,
    difference: cashDifference.value,
    activeTablesCount: cashRegisterActiveTables.value,
    cashMovementsIn: cashMovementsIn.value,
    cashMovementsOut: cashMovementsOut.value,
    orderIds: cashRegisterOrders.value.map((order) => order.id),
    closedBy: user.value?.email || 'admin',
  }

  try {
    await createDocument('cashClosures', closure)
    await deleteDocument('cashRegisters', 'current')
    cashClosures.value = [closure, ...cashClosures.value]
    currentCashRegister.value = null
    openingAmount.value = 0
    closingAmount.value = null
    cashFeedbackType.value = 'success'
    cashFeedback.value = 'Caja cerrada y guardada en el historial.'
  } catch (error) {
    cashFeedbackType.value = 'error'
    cashFeedback.value = 'No se pudo cerrar la caja en Firestore.'
    console.error('No se pudo cerrar la caja.', error)
  }
}

const createCashReportMarkup = (report: any) => {
  const lines = [
    ['Apertura', formatDateTime(report.openedAt)],
    ['Cierre', formatDateTime(report.closedAt || new Date().toISOString())],
    ['Importe inicial', formatPrice(report.openingAmount)],
    ['Ventas efectivo', formatPrice(report.cashSales)],
    ['Ventas tarjeta', formatPrice(report.cardSales)],
    ['Ventas totales', formatPrice(report.totalSales)],
    ['Entradas manuales', formatPrice(report.cashMovementsIn || 0)],
    ['Salidas manuales', formatPrice(report.cashMovementsOut || 0)],
    ['Efectivo contado', formatPrice(report.countedCash ?? 0)],
    ['Efectivo esperado', formatPrice(report.expectedCash ?? Number(report.openingAmount || 0) + Number(report.cashSales || 0))],
    ['Diferencia', formatPrice(report.difference ?? 0)],
    ['Mesas atendidas', String(report.activeTablesCount ?? 0)],
  ]
  const orderRows = (report.orderIds || []).map((id: string) => `<li>${id}</li>`).join('')
  return `<h1>Informe de caja</h1><p>Generado el ${new Date().toLocaleString()}</p><table>${lines.map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`).join('')}</table><h2>Pedidos incluidos</h2><ul>${orderRows || '<li>Sin pedidos cobrados</li>'}</ul>`
}

const printCashReport = () => {
  if (!currentCashRegister.value) return
  const report = {
    ...currentCashRegister.value,
    cashSales: cashRegisterCashTotal.value,
    cardSales: cashRegisterCardTotal.value,
    totalSales: cashRegisterTotal.value,
    countedCash: Number(closingAmount.value) || 0,
    expectedCash: expectedCashAtClose.value,
    difference: cashDifference.value,
    activeTablesCount: cashRegisterActiveTables.value,
    cashMovementsIn: cashMovementsIn.value,
    cashMovementsOut: cashMovementsOut.value,
    orderIds: cashRegisterOrders.value.map((order) => order.id),
  }
  const printWindow = window.open('', '_blank', 'width=800,height=900')
  if (!printWindow) return
  printWindow.document.write(`<html><head><title>Informe de caja</title><style>body{font-family:Arial;padding:32px;color:#111}table{width:100%;border-collapse:collapse}td{padding:10px;border-bottom:1px solid #ddd}td:last-child{text-align:right;font-weight:bold}</style></head><body>${createCashReportMarkup(report)}</body></html>`)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

const printCashClosureReport = (report: any) => {
  if (!report) return
  const printWindow = window.open('', '_blank', 'width=800,height=900')
  if (!printWindow) return
  printWindow.document.write(`<html><head><title>Informe de cierre</title><style>body{font-family:Arial;padding:32px;color:#111}table{width:100%;border-collapse:collapse}td{padding:10px;border-bottom:1px solid #ddd}td:last-child{text-align:right;font-weight:bold}</style></head><body>${createCashReportMarkup(report)}</body></html>`)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

const printLatestCashReport = () => printCashClosureReport(cashClosures.value[0])

type DataExportPeriod = 'week' | 'month' | 'year'

const getDataPeriodStart = (period: DataExportPeriod) => {
  const start = new Date()
  if (period === 'week') {
    const day = start.getDay() || 7
    start.setDate(start.getDate() - day + 1)
  } else if (period === 'month') {
    start.setDate(1)
  } else {
    start.setMonth(0, 1)
  }
  start.setHours(0, 0, 0, 0)
  return start
}

const downloadDataExport = (period: DataExportPeriod) => {
  const start = getDataPeriodStart(period)
  const inPeriod = (value: string | undefined) => Boolean(value && new Date(value) >= start)
  downloadDataExportPdf({
    period,
    periodStart: start.toISOString(),
    paidOrders: paidHistory.value.filter((order) => inPeriod(order.paidAt ?? order.updatedAt)),
    cashClosures: cashClosures.value.filter((closure) => inPeriod(closure.closedAt)),
    cashMovements: cashMovements.value.filter((movement) => inPeriod(movement.createdAt)),
    tables: tables.value,
    products: products.value,
    categories: categories.value,
    company: companySettings.value,
  })
}

const clearOperationalData = async () => {
  if (!canWriteAdminData.value) return
  const confirmed = window.confirm('Se eliminarán pedidos, pagos, sesiones y movimientos de caja. Productos, categorías y empresa se conservarán. ¿Continuar?')
  if (!confirmed) return

  const operationalCollections = ['orders', 'tableSessions', 'payments', 'cashRegisters', 'cashClosures', 'cashMovements']
  try {
    await Promise.all(operationalCollections.map(async (collectionName) => {
      const documents = await getCollectionSnapshot<any>(collectionName)
      await Promise.all(documents.map((document) => deleteDocument(collectionName, document.id)))
    }))
    await Promise.all(tables.value.map((table) => upsertDocument('tables', table.id, {
      ...table,
      active: false,
      currentSessionId: null,
      paymentRequested: false,
      paymentMethod: null,
      paymentSplitCount: null,
      paymentNote: null,
    })))
    clearOrders()
    cashClosures.value = []
    cashMovements.value = []
    currentCashRegister.value = null
    cashFeedbackType.value = 'success'
    cashFeedback.value = 'Resultados operativos eliminados. Catálogo y empresa conservados.'
  } catch (error) {
    cashFeedbackType.value = 'error'
    cashFeedback.value = 'No se pudieron eliminar todos los resultados operativos.'
    console.error('No se pudieron limpiar los datos operativos.', error)
  }
}

// Edit states
const editingCategoryId = ref<string | null>(null)
const editingCategoryName = ref('')
const editingCategoryNameEn = ref('')
const editingProductId = ref<string | null>(null)
const editingProduct = ref<any>({})

const currentModuleLabel = computed(() => {
  const module = modules.find((item) => item.key === selectedModule.value)
  return module ? module.title : 'Gestión'
})

watch(selectedPaidTableId, () => {
  paymentHistoryPage.value = 1
})

const { sessionExpiresAt } = useAuthStore()
const formatSessionTime = computed(() => {
  if (!sessionExpiresAt.value) return ''
  const expiresAt = new Date(sessionExpiresAt.value)
  return expiresAt.toLocaleString([], {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
})

const addCategory = async () => {
  const value = newCategory.value.trim()
  if (!value) return

  if (!canWriteAdminData.value) {
    console.warn('Solo el administrador autenticado puede modificar categorías en Firebase.')
    return
  }

  const category = {
    id: `cat-${Date.now()}`,
    name: value,
    nameEn: newCategoryEn.value.trim(),
  }

  categories.value.push(category)
  
  if (db) {
    try {
      await createDocument('categories', category)
    } catch (error) {
      console.warn('Could not save category to Firebase (might not be authenticated):', error)
    }
  }
  
  newCategory.value = ''
  newCategoryEn.value = ''
}

const startEditCategory = (id: string, name: string, nameEn = '') => {
  editingCategoryId.value = id
  editingCategoryName.value = name
  editingCategoryNameEn.value = nameEn
}

const saveCategory = async (categoryId: string) => {
  const category = categories.value.find((cat: any) => cat.id === categoryId)
  if (category && editingCategoryName.value.trim()) {
    if (!canWriteAdminData.value) {
      console.warn('Solo el administrador autenticado puede modificar categorías en Firebase.')
      return
    }

    category.name = editingCategoryName.value.trim()
    category.nameEn = editingCategoryNameEn.value.trim()
    
    if (db) {
      try {
        await upsertDocument('categories', category.id, category)
      } catch (error) {
        console.warn('Could not save category to Firebase (might not be authenticated):', error)
      }
    }
    
    editingCategoryId.value = null
    editingCategoryName.value = ''
    editingCategoryNameEn.value = ''
  }
}

const cancelEditCategory = () => {
  editingCategoryId.value = null
  editingCategoryName.value = ''
  editingCategoryNameEn.value = ''
}

const removeCategory = async (categoryId: string) => {
  if (!canWriteAdminData.value) {
    console.warn('Solo el administrador autenticado puede borrar categorías en Firebase.')
    return
  }

  categories.value = categories.value.filter((category: any) => category.id !== categoryId)

  const productsToKeep = products.value.filter((product: any) => product.categoryId !== categoryId)
  const productsToDelete = products.value.filter((product: any) => product.categoryId === categoryId)
  products.value = productsToKeep

  if (db) {
    try {
      await deleteDocument('categories', categoryId)
      await Promise.all(
        productsToDelete.map((product: any) => deleteDocument('products', product.id)),
      )
    } catch (error) {
      console.warn('Could not delete category and products from Firebase (might not be authenticated):', error)
    }
  }
}

const parseAllergens = (value: string | string[] | undefined) => {
  if (!value) return []

  const rawValues = Array.isArray(value) ? value : value.split(',')

  return [...new Set(
    rawValues
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
      .map((item) => {
        const match = allergenOptions.find((option) => option.value === item || option.label.toLowerCase() === item)
        return match ? match.value : item
      }),
  )]
}

const appendAllergenValue = (currentValue: string[] | undefined, nextValue: string) => {
  const values = parseAllergens(currentValue)

  if (!values.includes(nextValue)) {
    values.push(nextValue)
  }

  return values
}

const addSelectedAllergenToNewProduct = () => {
  newProductAllergens.value = appendAllergenValue(newProductAllergens.value, selectedAllergenToAdd.value)
}

const addSelectedAllergenToEditingProduct = () => {
  editingProduct.value.allergens = appendAllergenValue(editingProduct.value.allergens, selectedAllergenToAdd.value)
}

const removeAllergenFromNewProduct = (value: string) => {
  newProductAllergens.value = newProductAllergens.value.filter((allergen) => allergen !== value)
}

const removeAllergenFromEditingProduct = (value: string) => {
  editingProduct.value.allergens = (editingProduct.value.allergens || []).filter(
    (allergen: string) => allergen !== value,
  )
}

const addProduct = async () => {
  const name = newProductName.value.trim()
  if (!name) return

  if (!canWriteAdminData.value) {
    console.warn('Solo el administrador autenticado puede crear productos en Firebase.')
    return
  }

  if (!categories.value.length) {
    console.warn('Debes crear una categoría antes de añadir un producto.')
    return
  }

  const validCategory = categories.value.find((category: any) => category.id === newProductCategory.value)
  if (!validCategory) {
    newProductCategory.value = categories.value[0].id
  }

  const product = {
    id: `product-${Date.now()}`,
    name,
    description: newProductDescription.value.trim(),
    nameEn: newProductNameEn.value.trim(),
    descriptionEn: newProductDescriptionEn.value.trim(),
    price: Number(newProductPrice.value) || 0,
    stock: Number(newProductStock.value) || 100,
    lowStockThreshold: Number(newProductLowStockThreshold.value) || 5,
    image: newProductImage.value.trim(),
    allergens: parseAllergens(newProductAllergens.value),
    available: true,
    categoryId: newProductCategory.value || categories.value[0].id,
  }

  products.value.push(product)
  
  if (db) {
    try {
      await createDocument('products', product)
    } catch (error) {
      console.warn('Could not save product to Firebase (might not be authenticated):', error)
    }
  }

  newProductName.value = ''
  newProductDescription.value = ''
  newProductNameEn.value = ''
  newProductDescriptionEn.value = ''
  newProductPrice.value = 0
  newProductStock.value = 100
  newProductLowStockThreshold.value = 5
  newProductImage.value = ''
  newProductAllergens.value = []
}

const startEditProduct = (product: any) => {
  editingProductId.value = product.id
  editingProduct.value = {
    ...product,
    allergens: parseAllergens(product.allergens),
  }
}

const saveProduct = async (productId: string) => {
  const productIndex = products.value.findIndex((p: any) => p.id === productId)
  if (productIndex >= 0) {
    if (!canWriteAdminData.value) {
      console.warn('Solo el administrador autenticado puede modificar productos en Firebase.')
      return
    }

    const payload = {
      ...editingProduct.value,
      allergens: parseAllergens(editingProduct.value.allergens),
      stock: Number(editingProduct.value.stock ?? 100) || 100,
      lowStockThreshold: Number(editingProduct.value.lowStockThreshold ?? 5) || 5,
      image: editingProduct.value.image?.trim?.() || '',
    }


    products.value[productIndex] = payload
    
    if (db) {
      try {
        await upsertDocument('products', productId, payload)
      } catch (error) {
        console.warn('Could not save product to Firebase (might not be authenticated):', error)
      }
    }
    
    editingProductId.value = null
    editingProduct.value = {}
  }
}

const cancelEditProduct = () => {
  editingProductId.value = null
  editingProduct.value = {}
}

const removeProduct = async (productId: string) => {
  if (!canWriteAdminData.value) {
    console.warn('Solo el administrador autenticado puede borrar productos en Firebase.')
    return
  }

  products.value = products.value.filter((product: any) => product.id !== productId)
  
  if (db) {
    try {
      await deleteDocument('products', productId)
    } catch (error) {
      console.warn('Could not delete product from Firebase (might not be authenticated):', error)
    }
  }
}

const getNextTableNumber = () => {
  const next = tables.value.reduce((max: number, table: any) => Math.max(max, Number(table.number) || 0), 0) + 1
  return next
}

const addTable = async () => {
  if (!canWriteAdminData.value) {
    console.warn('Solo el administrador autenticado puede crear mesas en Firebase.')
    return
  }

  const requestedNumber = Number(newTableNumber.value)
  const nextNumber = requestedNumber > 0 ? requestedNumber : getNextTableNumber()

  const exists = tables.value.some((table: any) => Number(table.number) === nextNumber)
  const finalNumber = exists ? getNextTableNumber() : nextNumber
  const table = {
    id: `table-${Date.now()}`,
    number: finalNumber,
    active: false,
    qrIdentifier: `mesa-${String(finalNumber).padStart(3, '0')}`,
    paymentRequested: false,
  }

  tables.value.push(table)
  tables.value = [...tables.value].sort((a: any, b: any) => Number(a.number) - Number(b.number))
  
  if (db) {
    try {
      await createDocument('tables', table)
    } catch (error) {
      console.warn('Could not save table to Firebase (might not be authenticated):', error)
    }
  }
  
  newTableNumber.value = null
}

const toggleProductAvailability = async (productId: string) => {
  if (!canWriteAdminData.value) {
    console.warn('Solo el administrador autenticado puede cambiar la disponibilidad de productos.')
    return
  }

  const product = products.value.find((item: any) => item.id === productId)
  if (!product) return

  const updatedAvailability = !Boolean(product.available)
  const updatedProduct = { ...product, available: updatedAvailability }
  products.value = products.value.map((item: any) => item.id === productId ? updatedProduct : item)

  if (db) {
    try {
      await upsertDocument('products', productId, { available: updatedProduct.available })
    } catch (error) {
      products.value = products.value.map((item: any) => item.id === productId ? product : item)
      console.warn('No se pudo guardar la disponibilidad del producto.', error)
    }
  }
}

const toggleTableState = async (tableId: string) => {
  if (!canWriteAdminData.value) {
    console.warn('Solo el administrador autenticado puede cambiar el estado de mesas en Firebase.')
    return
  }

  tables.value = tables.value.map((table: any) => {
    if (table.id === tableId) {
      const active = !table.active
      return {
        ...table,
        active,
        ...(active ? {} : {
          currentSessionId: null,
          paymentRequested: false,
          paymentMethod: null,
          paymentSplitCount: null,
          paymentNote: null,
        }),
      }
    }
    return table
  })
  const tableToUpdate = tables.value.find((table: any) => table.id === tableId)
  
  if (db && tableToUpdate) {
    try {
      await upsertDocument('tables', tableId, tableToUpdate)
    } catch (error) {
      console.warn('Could not update table in Firebase (might not be authenticated):', error)
    }
  }
}

const removeTable = async (tableId: string) => {
  if (!canWriteAdminData.value) {
    console.warn('Solo el administrador autenticado puede borrar mesas en Firebase.')
    return
  }

  tables.value = tables.value.filter((table: any) => table.id !== tableId)
  
  if (db) {
    try {
      await deleteDocument('tables', tableId)
    } catch (error) {
      console.warn('Could not delete table from Firebase (might not be authenticated):', error)
    }
  }
}

const getTableLabel = (tableId: string) => {
  const match = tables.value.find((table: any) => table.id === tableId)
  return match ? String(match.number).padStart(2, '0') : '—'
}

const formatDateTime = (value: string) => new Date(value).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const formatPrice = (value: number) => `${value.toFixed(2)} €`

const openTable = (qrIdentifier: string) => {
  // Force open the table for admin, creating a new session
  tableSessionStore.forceOpenTableByQrIdentifier(qrIdentifier)
  
  // Open the table view in a new window with admin flag
  const tablePath = `${import.meta.env.BASE_URL}mesa/${encodeURIComponent(qrIdentifier)}`
  const url = new URL(`${tablePath}?from=admin`, window.location.origin)
  window.open(url.href, '_blank', 'noopener,noreferrer')
}

const downloadQr = async (table: any) => {
  const tablePath = `${import.meta.env.BASE_URL}mesa/${encodeURIComponent(table.qrIdentifier)}`
  const url = new URL(tablePath, window.location.origin).href
  const canvas = await QRCode.toCanvas(url, {
    width: 640,
    margin: 2,
    color: {
      dark: '#111827',
      light: '#ffffff',
    },
  })

  const link = document.createElement('a')
  link.download = `qr-mesa-${table.number}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

const handleLogout = async () => {
  await logout()
  router.replace('/login')
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
}

.admin-shell {
  min-height: 100vh;
  height: auto;
  overflow-y: auto;
  overflow-x: hidden;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1a1f35 100%);
  padding: 40px 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.admin-shell::-webkit-scrollbar {
  display: none;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  padding: 40px 48px;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  margin-bottom: 40px;
  gap: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.header-content {
  flex: 1;
}

.eyebrow {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 12px;
}

h1 {
  font-size: 2.8rem;
  font-weight: 900;
  background: linear-gradient(135deg, #fff 0%, #e5e7eb 100%);
  letter-spacing: -1px;
}

.subtitle {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.session-info {
  font-size: 0.85rem;
  color: #fbbf24;
  margin-top: 12px;
  font-weight: 600;
  padding: 8px 12px;
  background: rgba(251, 191, 36, 0.1);
  border-radius: 8px;
  border-left: 3px solid #fbbf24;
  display: inline-block;
}

.logout-btn {
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.logout-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(239, 68, 68, 0.5);
  background: linear-gradient(135deg, #f87171 0%, #fca5a5 100%);
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
}

.stat-box {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(51, 65, 85, 0.8) 100%);
  padding: 28px;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.stat-box::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
.field-group select {
  width: 100%;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.76);
  color: white;
  font: inherit;
}
}

.stat-box:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
.field-group select:focus {
  outline: none;
  border-color: #f97316;
  box-shadow: 0 0 12px rgba(249, 115, 22, 0.18);
}
  border-color: rgba(255, 255, 255, 0.2);
}

.stat-icon {
  font-size: 3rem;
  min-width: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.stat-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 2.4rem;
  font-weight: 900;
  color: #fff;
  margin: 4px 0 0;
}

.section {
  margin-bottom: 48px;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 900;
  color: #fff;
  margin-bottom: 28px;
  padding-left: 4px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

.module-card {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.6) 100%);
  border-radius: 18px;
  padding: 28px 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.module-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  transition: all 0.3s ease;
}

.module-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.2);
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(51, 65, 85, 0.8) 100%);
}

.module-card:hover::before {
  transform: translate(50px, 50px);
}

.module-icon {
  font-size: 3.2rem;
  line-height: 1;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
}

.module-content h3 {
  margin: 0;
  color: #fff;
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.module-content p {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  line-height: 1.5;
}

.module-btn {
  padding: 10px 18px;
  background: linear-gradient(135deg, #f97316 0%, #ff6b35 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
}

.module-btn:hover {
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.35);
  background: linear-gradient(135deg, #ff6b35 0%, #ff8855 100%);
}

.card {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.6) 100%);
  border-radius: 18px;
  padding: 32px 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
}

.card-icon {
  font-size: 3rem;
  display: block;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2));
}

.card h3 {
  font-size: 1.3rem;
  color: #fff;
  margin: 0;
  font-weight: 800;
}

.card p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.5;
}

.card-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

.card-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: scale(1.02) translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.35);
}

.management-panel {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.6) 100%);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header {
  margin-bottom: 28px;
  padding-bottom: 18px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.15);
}

.panel-header h2 {
  margin: 0;
  font-size: 1.6rem;
  color: #fff;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.management-card {
  background: transparent;
  border-radius: 0;
  padding: 0;
}

.gallery-admin-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.gallery-admin-item {
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.72);
}

.gallery-admin-item > img {
  display: block;
  width: 100%;
  height: 108px;
  object-fit: cover;
}

.gallery-admin-item-info {
  display: grid;
  gap: 8px;
  padding: 9px;
}

.gallery-admin-item-info strong {
  overflow: hidden;
  color: rgba(255, 255, 255, 0.86);
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gallery-admin-item-info .product-actions {
  gap: 6px;
}

.gallery-admin-item-info .chip,
.gallery-admin-item-info .danger-btn {
  padding: 6px 8px;
  font-size: 0.7rem;
}

.gallery-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 18px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.82rem;
}

.gallery-pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

@media (min-width: 720px) {
  .gallery-admin-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

.row {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.company-settings-form {
  display: grid;
  gap: 18px;
}

.company-section-heading {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 10px;
  padding: 14px 0 2px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.company-section-heading-wide {
  grid-column: 1 / -1;
}

.company-section-heading > span {
  color: #fb923c;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.company-section-heading h3 {
  margin: 0;
  color: #fff;
  font-size: 1rem;
}

.company-section-heading p {
  margin: 3px 0 0;
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.78rem;
}

.company-image-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.45);
}

.company-image-preview img {
  display: block;
  width: 58px;
  height: 58px;
  border-radius: 8px;
  object-fit: cover;
}

.company-image-preview.banner-preview img {
  width: 116px;
  height: 58px;
}

.company-image-preview .chip {
  margin-left: auto;
  white-space: nowrap;
}

.field-group {
  display: grid;
  gap: 8px;
}

.field-group label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.field-group input {
  width: 100%;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  color: #fff;
  padding: 12px 14px;
  font-size: 0.96rem;
}

.field-grid {
  display: grid;
  gap: 18px;
}

.field-grid.two-columns {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field-grid.three-columns {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.history-panel {
  margin-top: 24px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 18px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.history-header h3 {
  color: white;
  margin: 0;
  font-size: 1.05rem;
}

.history-header select {
  background: rgba(15, 23, 42, 0.8);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  padding: 8px 12px;
}

.history-list {
  display: grid;
  gap: 10px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.04);
  padding: 12px 14px;
  border-radius: 12px;
  color: white;
}

.history-item p {
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.78rem;
}

.history-item-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.payment-history-group {
  align-items: flex-start;
}

.payment-history-items {
  display: grid;
  gap: 3px;
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.8rem;
}

.payment-history-items .rejected {
  color: #fca5a5;
  text-decoration: line-through;
}

.history-empty {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.cash-register-panel {
  display: grid;
  gap: 24px;
}

.data-management-panel {
  display: grid;
  gap: 24px;
}

.data-management-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.data-management-header h3 {
  margin: 4px 0 0;
  color: white;
}

.data-safety-note {
  color: #86efac;
  font-size: 0.8rem;
  font-weight: 700;
}

.data-management-description {
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
}

.data-export-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.data-export-card {
  display: grid;
  gap: 12px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
}

.data-export-icon {
  font-size: 1.5rem;
}

.data-export-card strong {
  color: white;
}

.data-export-card p {
  min-height: 38px;
  margin: 5px 0 0;
  color: rgba(255, 255, 255, 0.66);
  font-size: 0.82rem;
  line-height: 1.45;
}

.data-shortcuts {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.data-danger-zone {
  display: grid;
  gap: 10px;
  padding: 18px;
  border: 1px solid rgba(248, 113, 113, 0.28);
  border-radius: 16px;
  background: rgba(127, 29, 29, 0.18);
}

.data-danger-zone strong {
  color: #fecaca;
}

.data-danger-zone p {
  margin: 0;
  color: rgba(254, 202, 202, 0.78);
  font-size: 0.85rem;
  line-height: 1.5;
}

.supplier-form,
.supplier-list {
  display: grid;
  gap: 18px;
}

.supplier-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  color: white;
}

.supplier-card strong {
  font-size: 1.05rem;
}

.supplier-card p {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.86rem;
}

.supplier-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.supplier-actions a {
  text-decoration: none;
}

.cash-register-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.cash-register-header h3 {
  margin: 4px 0 0;
  color: #fff;
  font-size: 1.25rem;
}

.cash-status {
  padding: 8px 12px;
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 999px;
  color: #fca5a5;
  font-size: 0.75rem;
  font-weight: 800;
}

.cash-status.open {
  border-color: rgba(34, 197, 94, 0.4);
  color: #86efac;
}

.cash-feedback {
  margin: 0;
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 0.86rem;
  font-weight: 700;
}

.cash-feedback.success {
  background: rgba(34, 197, 94, 0.12);
  color: #86efac;
}

.cash-feedback.error {
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
}

.cash-guide {
  display: grid;
  gap: 6px;
  padding: 16px 18px;
  border-left: 3px solid #f97316;
  border-radius: 0 12px 12px 0;
  background: rgba(249, 115, 22, 0.08);
}

.cash-guide strong {
  color: #fff;
  margin-bottom: 3px;
}

.cash-guide p {
  margin: 0;
  color: rgba(255, 255, 255, 0.68);
  font-size: 0.84rem;
  line-height: 1.45;
}

.cash-guide b {
  color: #fed7aa;
}

.cash-opening-form,
.cash-closing-form {
  display: grid;
  gap: 12px;
  max-width: 560px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.48);
}

.cash-opening-form label,
.cash-closing-form label {
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.82rem;
  font-weight: 800;
}

.cash-opening-form input,
.cash-closing-form input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.8);
  color: #fff;
  font: inherit;
}

.cash-opening-form .ghost-btn,
.cash-closing-form .ghost-btn {
  justify-self: start;
}

.cash-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.cash-summary-card {
  display: grid;
  gap: 8px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.58);
}

.cash-summary-card span,
.cash-closing-form p {
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.8rem;
}

.cash-calculation-note {
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(249, 115, 22, 0.1);
  color: #fed7aa !important;
  line-height: 1.45;
}

.cash-summary-card strong {
  color: #fff;
  font-size: 1.25rem;
}

.cash-summary-card.cash { border-color: rgba(34, 197, 94, 0.35); }
.cash-summary-card.card-payment { border-color: rgba(96, 165, 250, 0.35); }
.cash-summary-card.total { border-color: rgba(249, 115, 22, 0.4); }

.cash-closing-form p { margin: 0; }
.cash-closing-form p strong { color: #fff; }
.cash-closing-form p strong.cash-growth { color: #86efac; }
.cash-difference.positive strong { color: #86efac; }
.cash-difference.negative strong { color: #fca5a5; }
.cash-difference.pending strong { color: #fed7aa; }

.cash-movements-section {
  display: grid;
  gap: 14px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.34);
}

.cash-movement-balance {
  color: #fed7aa;
  font-size: 0.85rem;
  font-weight: 800;
}

.cash-movement-form {
  display: grid;
  grid-template-columns: 1.6fr 1fr 0.8fr auto;
  gap: 10px;
}

.cash-movement-form input,
.cash-movement-form select {
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.8);
  color: #fff;
  font: inherit;
}

.cash-movement-list {
  display: grid;
  gap: 8px;
}

.cash-movement-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.76);
  font-size: 0.86rem;
}

.cash-movement-row strong.in { color: #86efac; }
.cash-movement-row strong.out { color: #fca5a5; }

.cash-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.cash-history {
  display: grid;
  gap: 14px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.toggle-inline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #e2e8f0;
  font-weight: 600;
}

.toggle-inline input {
  width: auto;
  margin: 0;
}

.row input,
.row select {
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font: inherit;
  flex: 1;
  min-width: 140px;
  background: rgba(15, 23, 42, 0.6);
  color: white;
  transition: all 0.2s ease;
}

.row input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.row input:focus,
.row select:focus {
  outline: none;
  border-color: #f97316;
  background: rgba(15, 23, 42, 0.8);
  box-shadow: 0 0 12px rgba(249, 115, 22, 0.2);
}
.product-create-form {
  display: grid;
  gap: 18px;
  padding: 18px;
  margin-bottom: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.28);
}

.form-header {
  display: grid;
  gap: 4px;
}

.form-header h3 {
  margin: 0;
  color: #fff;
  font-size: 1.1rem;
}

.form-header p {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field-block {
  display: grid;
  gap: 8px;
}

.field-block span {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
}

.field-block input,
.field-block select,
.product-create-form input,
.product-create-form select {
  width: 100%;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.76);
  color: white;
  font: inherit;
}

.field-block input::placeholder,
.product-create-form input::placeholder {
  color: rgba(255, 255, 255, 0.46);
}

.field-block input:focus,
.field-block select:focus,
.product-create-form input:focus,
.product-create-form select:focus {
  outline: none;
  border-color: #f97316;
  box-shadow: 0 0 12px rgba(249, 115, 22, 0.18);
}

.gallery-image-select {
  color-scheme: dark;
  appearance: auto;
  border-color: rgba(249, 115, 22, 0.42) !important;
  background: rgba(30, 41, 59, 0.92) !important;
  color: #fed7aa !important;
  font-size: 0.86rem !important;
}

.gallery-image-select option {
  background: #1e293b;
  color: #f8fafc;
}

.field-block-wide,
.allergen-field.field-block-wide,
.product-create-form .allergen-field {
  grid-column: 1 / -1;
}

.form-actions {
  display: flex;
  justify-content: flex-start;
}

.product-summary {
  display: grid;
  gap: 5px;
  min-width: 0;
}
.product-summary strong,
.product-summary small {
  display: block;
}
.product-summary strong {
  color: #fff;
  font-size: 1rem;
}
.product-summary small {
  color: rgba(255, 255, 255, 0.68);
  line-height: 1.45;
}
.product-summary small:last-child {
  color: #fed7aa;
  font-size: 0.95rem;
  font-weight: 800;
}

.allergen-field {
  display: grid;
  gap: 8px;
  flex: 1 1 100%;
  min-width: 260px;
  padding: 14px;
  background: rgba(15, 23, 42, 0.34);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.allergen-field > label {
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.allergen-picker {
  display: flex;
  align-items: center;
  gap: 10px;
}

.allergen-picker select {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.82);
  color: white;
  font: inherit;
}

.allergen-picker select:focus {
  outline: none;
  border-color: #f97316;
  box-shadow: 0 0 10px rgba(249, 115, 22, 0.18);
}

.selected-allergens {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.allergen-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 10px;
  border: 1px solid rgba(249, 115, 22, 0.34);
  border-radius: 999px;
  background: rgba(249, 115, 22, 0.14);
  color: #fed7aa;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.allergen-chip span {
  color: #fb923c;
  font-size: 1rem;
  line-height: 1;
}

.field-hint {
  color: rgba(255, 255, 255, 0.48);
  font-size: 0.78rem;
}

.ghost-btn {
  padding: 12px 24px;
  background: rgba(249, 115, 22, 0.15);
  border: 2px solid #f97316;
  color: #f97316;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ghost-btn:hover {
  background: #f97316;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(249, 115, 22, 0.3);
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 12px;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
  color: white;
}

.list-item:hover {
  background: rgba(15, 23, 42, 0.8);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateX(4px);
}

.danger-btn {
  padding: 8px 14px;
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid #ef4444;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.danger-btn:hover {
  background: #ef4444;
  color: white;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.chip {
  padding: 8px 14px;
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(255, 107, 53, 0.1) 100%);
  color: #f97316;
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.chip:hover {
  background: rgba(249, 115, 22, 0.25);
  border-color: #f97316;
  transform: scale(1.05);
}

.product-item {
  flex-wrap: wrap;
}

.product-item:hover {
  transform: none;
}

.product-view {
  display: grid;
  gap: 14px;
  width: 100%;
}

.product-actions {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  width: 100%;
}

.table-item {
  justify-content: space-between;
}

/* Edit styles */
.edit-row {
  display: flex;
  gap: 10px;
  width: 100%;
  flex-wrap: wrap;
  align-items: center;
}

.edit-input {
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  font: inherit;
  flex: 1;
  min-width: 120px;
  background: rgba(15, 23, 42, 0.8);
  color: white;
  transition: all 0.2s ease;
}

.edit-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.edit-input:focus {
  outline: none;
  border-color: #f97316;
  background: rgba(15, 23, 42, 0.95);
  box-shadow: 0 0 10px rgba(249, 115, 22, 0.2);
}

.edit-product-form {
  display: grid;
  gap: 14px;
  width: 100%;
  padding: 18px;
  background: rgba(15, 23, 42, 0.58);
  border: 1px solid rgba(249, 115, 22, 0.18);
  border-radius: 16px;
  box-shadow: 0 12px 28px rgba(2, 6, 23, 0.16);
}

.compact-header {
  margin-bottom: 6px;
}

.edit-product-form .edit-input {
  width: 100%;
}

.flex-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  width: 100%;
  flex-wrap: wrap;
}

.btn-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.history-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.pagination-info {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  font-weight: 600;
  min-width: 140px;
  text-align: center;
}

.pagination-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(255, 107, 53, 0.1) 100%);
  color: #f97316;
  border: 1px solid rgba(249, 115, 22, 0.4);
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(249, 115, 22, 0.3);
  border-color: #f97316;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.stats-panel {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(255, 107, 53, 0.05) 100%);
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  border-color: #f97316;
  box-shadow: 0 8px 24px rgba(249, 115, 22, 0.2);
  transform: translateY(-4px);
}

.stat-period {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.stat-amount {
  font-size: 2.2rem;
  font-weight: 900;
  color: #f97316;
  margin: 0;
}

.payment-stats-section {
  display: grid;
  gap: 16px;
}

.payment-stats-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
}

.payment-stats-heading h3 {
  margin: 4px 0 0;
  color: #fff;
  font-size: 1.25rem;
}

.payment-stats-caption {
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.8rem;
}

.payment-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.payment-stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.58);
}

.payment-stat-card.cash {
  border-color: rgba(34, 197, 94, 0.35);
}

.payment-stat-card.card-payment {
  border-color: rgba(96, 165, 250, 0.35);
}

.payment-stat-icon {
  display: grid;
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  place-items: center;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 1.4rem;
}

.payment-stat-card p,
.payment-stat-card small {
  display: block;
  margin: 0;
}

.payment-stat-card p {
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.85rem;
  font-weight: 700;
}

.payment-stat-card strong {
  display: block;
  margin: 3px 0;
  color: #fff;
  font-size: 1.65rem;
}

.payment-stat-card small {
  color: rgba(255, 255, 255, 0.52);
  font-size: 0.78rem;
}

.tabs-container {
  margin-top: 24px;
  width: 100%;
}

.tab-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 12px 20px;
  background: rgba(249, 115, 22, 0.15);
  border: 2px solid rgba(249, 115, 22, 0.3);
  color: #f97316;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tab-btn:hover {
  background: rgba(249, 115, 22, 0.25);
  border-color: #f97316;
  transform: translateY(-2px);
}

.tab-btn.active {
  background: linear-gradient(135deg, #f97316 0%, #ff6b35 100%);
  color: white;
  border-color: #f97316;
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.3);
}

.chart-container {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 28px;
  width: 100%;
  max-width: 100%;
  min-height: 470px;
}

.chart-container.full-width {
  width: 100%;
  max-width: 100%;
}

.chart-container h3 {
  color: white;
  margin: 0 0 24px;
  font-size: 1.2rem;
  font-weight: 700;
}

.chart-wrapper {
  position: relative;
  height: 460px;
  width: 100%;
  max-width: 100%;
}

.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.95rem;
}

.history-panel.standalone {
  background: transparent;
  border: none;
  padding: 0;
}

@media (max-width: 1024px) {
  .admin-shell {
    padding: 24px 16px 40px;
  }

  .header {
    padding: 28px 30px;
  }

  .management-panel {
    padding: 24px;
  }

  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 32px;
  }

  .stats-grid,
  .data-export-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cash-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cash-movement-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .admin-shell {
    padding: 12px 10px 28px;
  }

  .header {
    flex-direction: column;
    text-align: center;
    align-items: stretch;
    gap: 18px;
    padding: 24px 18px;
    margin-bottom: 24px;
    border-radius: 18px;
  }

  .header-content {
    min-width: 0;
  }

  h1 {
    font-size: clamp(1.65rem, 7vw, 2.2rem);
    line-height: 1.08;
    overflow-wrap: anywhere;
  }

  .subtitle {
    line-height: 1.45;
  }

  .session-info {
    max-width: 100%;
    line-height: 1.35;
  }

  .logout-btn,
  .module-btn,
  .form-actions > button,
  .cash-actions > button {
    width: 100%;
  }

  .stats {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 28px;
  }

  .stat-box {
    min-width: 0;
    padding: 18px;
    gap: 14px;
    border-radius: 14px;
  }

  .stat-icon {
    min-width: 48px;
    font-size: 2.2rem;
  }

  .stat-value {
    font-size: 2rem;
  }

  .section {
    margin-bottom: 30px;
  }

  .section-title {
    margin-bottom: 16px;
    font-size: 1.35rem;
  }

  .cards-grid,
  .stats-grid,
  .data-export-grid,
  .payment-stats-grid,
  .form-grid,
  .field-grid.two-columns,
  .field-grid.three-columns {
    grid-template-columns: 1fr;
  }

  .module-card {
    padding: 20px 18px;
    border-radius: 14px;
  }

  .management-panel {
    padding: 18px 14px;
    border-radius: 16px;
  }

  .panel-header {
    margin-bottom: 20px;
    padding-bottom: 14px;
  }

  .panel-header h2 {
    font-size: 1.25rem;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .row,
  .allergen-picker,
  .history-header,
  .cash-register-header,
  .data-management-header,
  .payment-stats-heading,
  .supplier-card {
    align-items: stretch;
    flex-direction: column;
  }

  .row input,
  .row select,
  .row button,
  .allergen-picker select,
  .allergen-picker button {
    width: 100%;
    min-width: 0;
  }

  .product-create-form,
  .edit-product-form,
  .history-panel,
  .cash-movements-section,
  .cash-opening-form,
  .cash-closing-form {
    padding: 14px;
  }

  .list-item,
  .flex-row,
  .history-item,
  .cash-movement-row {
    align-items: stretch;
    flex-direction: column;
  }

  .table-actions,
  .product-actions,
  .btn-group,
  .supplier-actions,
  .history-item-actions,
  .cash-actions {
    width: 100%;
  }

  .table-actions > button,
  .product-actions > button,
  .btn-group > button,
  .supplier-actions > a,
  .supplier-actions > button,
  .history-item-actions > button,
  .history-item-actions > span {
    flex: 1 1 100%;
    text-align: center;
  }

  .allergen-field {
    min-width: 0;
  }

  .chart-container {
    min-height: 350px;
    padding: 16px 12px;
  }

  .chart-container h3 {
    margin-bottom: 16px;
    font-size: 1rem;
  }

  .chart-wrapper {
    height: 320px;
  }

  .tab-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .tab-btn {
    min-width: 0;
    padding: 10px 8px;
    font-size: 0.75rem;
  }

  .history-pagination {
    gap: 8px;
  }

  .pagination-info {
    min-width: 0;
    flex: 1;
  }
}

@media (max-width: 480px) {
  .admin-shell {
    padding-inline: 8px;
  }

  .header {
    padding: 20px 14px;
  }

  .eyebrow {
    font-size: 0.68rem;
    letter-spacing: 1.4px;
  }

  .stat-box {
    padding: 15px;
  }

  .section-title {
    font-size: 1.2rem;
  }

  .management-panel {
    padding-inline: 10px;
  }

  .tab-buttons {
    grid-template-columns: 1fr;
  }

  .pagination-btn {
    padding-inline: 10px;
    font-size: 0.72rem;
  }

  .pagination-info {
    font-size: 0.78rem;
  }

  .cash-summary-grid {
    grid-template-columns: 1fr;
  }

  .data-export-card p {
    min-height: 0;
  }

  .field-block input,
  .field-block select,
  .product-create-form input,
  .product-create-form select,
  .row input,
  .row select {
    font-size: 0.92rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin-shell *,
  .admin-shell *::before,
  .admin-shell *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
</style>
