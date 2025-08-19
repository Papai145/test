class CRMApp {
  constructor() {
    this.currentSection = "deals";
    this.currentItemId = null;
    this.selectOptions = null;

    this.init();
    this.bindEvents();
    this.loadSelectOptions();
    this.loadList();
  }

  init() {}

  bindEvents() {
    document.querySelectorAll(".menu-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const section = e.target.dataset.section;
        this.showSection(section);
      });
    });

    document.getElementById("btn-edit").addEventListener("click", () => {
      this.showEditForm();
    });

    document.getElementById("btn-delete").addEventListener("click", () => {
      this.deleteCurrentItem();
    });
  }

  async loadSelectOptions() {
    try {
      const response = await this.apiRequest("get_select_options");
      this.selectOptions = response.data;
    } catch (error) {
      console.error("Error loading select options:", error);
    }
  }

  async loadList() {
    try {
      let endpoint = "";
      let title = "";

      switch (this.currentSection) {
        case "deals":
          endpoint = "get_deals";
          title = "Сделки";
          break;
        case "contacts":
          endpoint = "get_contacts";
          title = "Контакты";
          break;
        case "add":
          this.showAddForm();
          return;
      }

      document.getElementById("list-title").textContent = title;

      const response = await this.apiRequest(endpoint);
      this.renderList(response.data);
    } catch (error) {
      this.showError("Ошибка загрузки списка: " + error.message);
    }
  }

  renderList(items) {
    const listContainer = document.getElementById("list-items");
    listContainer.innerHTML = "";

    if (items.length === 0) {
      listContainer.innerHTML = '<div class="empty-state">Нет элементов</div>';
      return;
    }

    items.forEach((item) => {
      const listItem = document.createElement("div");
      listItem.className = "list-item";
      listItem.dataset.id = item.deal_id || item.contact_id;

      if (this.currentSection === "deals") {
        listItem.innerHTML = `
                    <div class="item-title">${item.title}</div>
                    <div class="item-subtitle">${item.price} руб.</div>
                    ${
                      item.contact_names
                        ? `<div class="item-subtitle">Контакты: ${item.contact_names}</div>`
                        : ""
                    }
                `;
      } else {
        listItem.innerHTML = `
                    <div class="item-title">${item.first_name} ${
          item.last_name
        }</div>
                    ${
                      item.deal_titles
                        ? `<div class="item-subtitle">Сделки: ${item.deal_titles}</div>`
                        : ""
                    }
                `;
      }

      listItem.addEventListener("click", () => {
        this.selectItem(item.deal_id || item.contact_id);
      });

      listContainer.appendChild(listItem);
    });
  }

  async selectItem(id) {
    this.currentItemId = id;

    // Снимаем выделение со всех элементов
    document.querySelectorAll(".list-item").forEach((item) => {
      item.classList.remove("active");
    });

    // Выделяем выбранный элемент
    const selectedItem = document.querySelector(`[data-id="${id}"]`);
    if (selectedItem) {
      selectedItem.classList.add("active");
    }

    // Показываем кнопки действий
    document.getElementById("btn-edit").classList.remove("hidden");
    document.getElementById("btn-delete").classList.remove("hidden");

    // Загружаем детали
    try {
      let endpoint = "";
      let title = "";

      if (this.currentSection === "deals") {
        endpoint = "get_deal";
        title = "Детали сделки";
      } else {
        endpoint = "get_contact";
        title = "Детали контакта";
      }

      document.getElementById("content-title").textContent = title;

      const response = await this.apiRequest(endpoint, { id });
      this.renderDetails(response.data);
    } catch (error) {
      this.showError("Ошибка загрузки деталей: " + error.message);
    }
  }

  renderDetails(data) {
    const contentBody = document.getElementById("content-body");
    contentBody.innerHTML = "";

    if (this.currentSection === "deals") {
      contentBody.innerHTML = `
                <div class="detail-row">
                    <span class="detail-label">ID:</span>
                    <span class="detail-value">${data.deal_id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Наименование:</span>
                    <span class="detail-value">${data.title}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Сумма:</span>
                    <span class="detail-value">${data.price} руб.</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Статус:</span>
                    <span class="detail-value">${data.status}</span>
                </div>
                ${
                  data.contact_ids
                    ? `
                <div class="detail-row">
                    <span class="detail-label">Контакты:</span>
                    <span class="detail-value">
                        ${data.contact_ids
                          .split(",")
                          .map(
                            (id, index) => `
                            <div>ID: ${id} - ${
                              data.contact_names.split(",")[index]
                            }</div>
                        `
                          )
                          .join("")}
                    </span>
                </div>`
                    : ""
                }
            `;
    } else {
      contentBody.innerHTML = `
                <div class="detail-row">
                    <span class="detail-label">ID:</span>
                    <span class="detail-value">${data.contact_id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Имя:</span>
                    <span class="detail-value">${data.first_name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Фамилия:</span>
                    <span class="detail-value">${data.last_name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${
                      data.email || "Не указан"
                    }</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Телефон:</span>
                    <span class="detail-value">${
                      data.phone || "Не указан"
                    }</span>
                </div>
                ${
                  data.deal_ids
                    ? `
                <div class="detail-row">
                    <span class="detail-label">Сделки:</span>
                    <span class="detail-value">
                        ${data.deal_ids
                          .split(",")
                          .map(
                            (id, index) => `
                            <div>ID: ${id} - ${
                              data.deal_titles.split(",")[index]
                            }</div>
                        `
                          )
                          .join("")}
                    </span>
                </div>`
                    : ""
                }
            `;
    }
  }

  showSection(section) {
    this.currentSection = section;

    // Обновляем меню
    document.querySelectorAll(".menu-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.section === section);
    });

    // Сбрасываем выделение
    this.currentItemId = null;
    document.querySelectorAll(".list-item").forEach((item) => {
      item.classList.remove("active");
    });

    // Скрываем кнопки действий
    document.getElementById("btn-edit").classList.add("hidden");
    document.getElementById("btn-delete").classList.add("hidden");

    // Очищаем контент
    document.getElementById("content-body").innerHTML =
      '<div class="empty-state">Выберите элемент из списка для просмотра деталей</div>';

    // Загружаем список
    if (section !== "add") {
      this.loadList();
    } else {
      this.showAddForm();
    }
  }

  showAddForm() {
    document.getElementById("list-title").textContent = "Добавить";
    document.getElementById("list-items").innerHTML = "";

    document.getElementById("content-title").textContent =
      "Добавить новый элемент";
    document.getElementById("btn-edit").classList.add("hidden");
    document.getElementById("btn-delete").classList.add("hidden");

    this.renderForm();
  }

  showEditForm() {
    document.getElementById("content-title").textContent =
      "Редактировать элемент";
    this.renderForm(true);
  }

  renderForm(isEdit = false) {
    const formContainer = document.getElementById("form-container");
    formContainer.classList.remove("hidden");

    if (this.currentSection === "deals") {
      formContainer.innerHTML = `
                <form id="deal-form" onsubmit="return app.handleDealSubmit(event, ${isEdit})">
                    ${
                      isEdit
                        ? '<input type="hidden" name="id" value="' +
                          this.currentItemId +
                          '">'
                        : ""
                    }
                    
                    <div class="form-group">
                        <label for="title">Наименование *</label>
                        <input type="text" id="title" name="title" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="price">Сумма</label>
                        <input type="number" id="price" name="price" step="0.01">
                    </div>
                    
                    <div class="form-group">
                        <label>Контакты</label>
                        <div class="multiselect" id="contacts-multiselect">
                            ${this.renderContactsMultiselect()}
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="app.cancelForm()">Отмена</button>
                        <button type="submit" class="btn-primary">Сохранить</button>
                    </div>
                </form>
            `;

      if (isEdit) {
        this.loadDealData();
      }
    } else {
      formContainer.innerHTML = `
                <form id="contact-form" onsubmit="return app.handleContactSubmit(event, ${isEdit})">
                    ${
                      isEdit
                        ? '<input type="hidden" name="id" value="' +
                          this.currentItemId +
                          '">'
                        : ""
                    }
                    
                    <div class="form-group">
                        <label for="first_name">Имя *</label>
                        <input type="text" id="first_name" name="first_name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="last_name">Фамилия *</label>
                        <input type="text" id="last_name" name="last_name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email">
                    </div>
                    
                    <div class="form-group">
                        <label for="phone">Телефон</label>
                        <input type="tel" id="phone" name="phone">
                    </div>
                    
                    <div class="form-group">
                        <label>Сделки</label>
                        <div class="multiselect" id="deals-multiselect">
                            ${this.renderDealsMultiselect()}
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="app.cancelForm()">Отмена</button>
                        <button type="submit" class="btn-primary">Сохранить</button>
                    </div>
                </form>
            `;

      if (isEdit) {
        this.loadContactData();
      }
    }
  }

  renderContactsMultiselect() {
    if (!this.selectOptions?.contacts) return "Загрузка...";

    return this.selectOptions.contacts
      .map(
        (contact) => `
            <div class="multiselect-item">
                <input type="checkbox" name="contact_ids[]" value="${contact.contact_id}" id="contact-${contact.contact_id}">
                <label for="contact-${contact.contact_id}">${contact.name}</label>
            </div>
        `
      )
      .join("");
  }

  renderDealsMultiselect() {
    if (!this.selectOptions?.deals) return "Загрузка...";

    return this.selectOptions.deals
      .map(
        (deal) => `
            <div class="multiselect-item">
                <input type="checkbox" name="deal_ids[]" value="${deal.deal_id}" id="deal-${deal.deal_id}">
                <label for="deal-${deal.deal_id}">${deal.title}</label>
            </div>
        `
      )
      .join("");
  }

  async loadDealData() {
    try {
      const response = await this.apiRequest("get_deal", {
        id: this.currentItemId,
      });
      const deal = response.data;

      document.getElementById("title").value = deal.title;
      document.getElementById("price").value = deal.price;

      // Устанавливаем выбранные контакты
      if (deal.contact_ids) {
        const contactIds = deal.contact_ids.split(",");
        contactIds.forEach((id) => {
          const checkbox = document.querySelector(
            `input[name="contact_ids[]"][value="${id}"]`
          );
          if (checkbox) checkbox.checked = true;
        });
      }
    } catch (error) {
      this.showError("Ошибка загрузки данных сделки: " + error.message);
    }
  }

  async loadContactData() {
    try {
      const response = await this.apiRequest("get_contact", {
        id: this.currentItemId,
      });
      const contact = response.data;

      document.getElementById("first_name").value = contact.first_name;
      document.getElementById("last_name").value = contact.last_name;
      document.getElementById("email").value = contact.email || "";
      document.getElementById("phone").value = contact.phone || "";

      // Устанавливаем выбранные сделки
      if (contact.deal_ids) {
        const dealIds = contact.deal_ids.split(",");
        dealIds.forEach((id) => {
          const checkbox = document.querySelector(
            `input[name="deal_ids[]"][value="${id}"]`
          );
          if (checkbox) checkbox.checked = true;
        });
      }
    } catch (error) {
      this.showError("Ошибка загрузки данных контакта: " + error.message);
    }
  }

  async handleDealSubmit(event, isEdit) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const contactIds = Array.from(
      document.querySelectorAll('input[name="contact_ids[]"]:checked')
    ).map((checkbox) => checkbox.value);

    try {
      if (isEdit) {
        await this.apiRequest("update_deal", {
          id: formData.get("id"),
          title: formData.get("title"),
          price: formData.get("price"),
          contact_ids: contactIds,
        });
        this.showSuccess("Сделка успешно обновлена!");
      } else {
        await this.apiRequest("add_deal", {
          title: formData.get("title"),
          price: formData.get("price"),
          contact_ids: contactIds,
        });
        this.showSuccess("Сделка успешно создана!");
      }

      this.cancelForm();
      this.loadList();
    } catch (error) {
      this.showError("Ошибка сохранения: " + error.message);
    }
  }

  async handleContactSubmit(event, isEdit) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const dealIds = Array.from(
      document.querySelectorAll('input[name="deal_ids[]"]:checked')
    ).map((checkbox) => checkbox.value);

    try {
      if (isEdit) {
        await this.apiRequest("update_contact", {
          id: formData.get("id"),
          first_name: formData.get("first_name"),
          last_name: formData.get("last_name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          deal_ids: dealIds,
        });
        this.showSuccess("Контакт успешно обновлен!");
      } else {
        await this.apiRequest("add_contact", {
          first_name: formData.get("first_name"),
          last_name: formData.get("last_name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          deal_ids: dealIds,
        });
        this.showSuccess("Контакт успешно создан!");
      }

      this.cancelForm();
      this.loadList();
    } catch (error) {
      this.showError("Ошибка сохранения: " + error.message);
    }
  }

  cancelForm() {
    document.getElementById("form-container").classList.add("hidden");
    document.getElementById("content-body").innerHTML =
      '<div class="empty-state">Выберите элемент из списка для просмотра деталей</div>';

    if (this.currentItemId) {
      this.selectItem(this.currentItemId);
    }
  }

  async deleteCurrentItem() {
    if (
      !this.currentItemId ||
      !confirm("Вы уверены, что хотите удалить этот элемент?")
    ) {
      return;
    }

    try {
      let endpoint = "";
      if (this.currentSection === "deals") {
        endpoint = "delete_deal";
      } else {
        endpoint = "delete_contact";
      }

      await this.apiRequest(endpoint, { id: this.currentItemId });
      this.showSuccess("Элемент успешно удален!");

      this.currentItemId = null;
      this.loadList();

      // Очищаем контент
      document.getElementById("content-body").innerHTML =
        '<div class="empty-state">Выберите элемент из списка для просмотра деталей</div>';
      document.getElementById("btn-edit").classList.add("hidden");
      document.getElementById("btn-delete").classList.add("hidden");
    } catch (error) {
      this.showError("Ошибка удаления: " + error.message);
    }
  }

  async apiRequest(action, data = {}) {
    const formData = new FormData();
    formData.append("action", action);

    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key + "[]", item));
      } else {
        formData.append(key, value);
      }
    }

    const response = await fetch("", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Unknown error");
    }

    return result;
  }

  showError(message) {
    this.showMessage(message, "error");
  }

  showSuccess(message) {
    this.showMessage(message, "success");
  }

  showMessage(message, type) {
    const modal = document.getElementById("modal");
    const modalBody = document.getElementById("modal-body");
    const modalTitle = document.getElementById("modal-title");

    modalTitle.textContent = type === "error" ? "Ошибка" : "Успех";
    modalBody.innerHTML = `<div class="${type}">${message}</div>`;

    modal.classList.remove("hidden");

    // Автоматически закрываем через 3 секунды для успешных сообщений
    if (type === "success") {
      setTimeout(() => {
        modal.classList.add("hidden");
      }, 3000);
    }
  }
}

// Глобальные функции для вызова из HTML
function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

function loadList() {
  app.loadList();
}

// Инициализация приложения
const app = new CRMApp();
