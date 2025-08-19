<?php
require_once 'DB.php';
$db = new DB();

// Обработка AJAX запросов
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	header('Content-Type: application/json');

	try {
		if (isset($_POST['action'])) {
			switch ($_POST['action']) {
				case 'get_deals':
					echo json_encode(['success' => true, 'data' => $db->getDeals()]);
					break;

				case 'get_contacts':
					echo json_encode(['success' => true, 'data' => $db->getContacts()]);
					break;

				case 'get_deal':
					$deal = $db->getDeal($_POST['id']);
					echo json_encode(['success' => true, 'data' => $deal]);
					break;

				case 'get_contact':
					$contact = $db->getContact($_POST['id']);
					echo json_encode(['success' => true, 'data' => $contact]);
					break;

				case 'add_deal':
					$contactIds = isset($_POST['contact_ids']) ? $_POST['contact_ids'] : [];
					$id = $db->addDeal($_POST['title'], $_POST['price'], $contactIds);
					echo json_encode(['success' => true, 'id' => $id]);
					break;

				case 'update_deal':
					$contactIds = isset($_POST['contact_ids']) ? $_POST['contact_ids'] : [];
					$db->updateDeal($_POST['id'], $_POST['title'], $_POST['price'], $contactIds);
					echo json_encode(['success' => true]);
					break;

				case 'delete_deal':
					$db->deleteDeal($_POST['id']);
					echo json_encode(['success' => true]);
					break;

				case 'add_contact':
					$dealIds = isset($_POST['deal_ids']) ? $_POST['deal_ids'] : [];
					$id = $db->addContact(
						$_POST['first_name'],
						$_POST['last_name'],
						$_POST['email'],
						$_POST['phone'],
						$dealIds
					);
					echo json_encode(['success' => true, 'id' => $id]);
					break;

				case 'update_contact':
					$dealIds = isset($_POST['deal_ids']) ? $_POST['deal_ids'] : [];
					$db->updateContact(
						$_POST['id'],
						$_POST['first_name'],
						$_POST['last_name'],
						$_POST['email'],
						$_POST['phone'],
						$dealIds
					);
					echo json_encode(['success' => true]);
					break;

				case 'delete_contact':
					$db->deleteContact($_POST['id']);
					echo json_encode(['success' => true]);
					break;

				case 'get_select_options':
					$options = [
						'contacts' => $db->getAllContactsForSelect(),
						'deals' => $db->getAllDealsForSelect()
					];
					echo json_encode(['success' => true, 'data' => $options]);
					break;

				default:
					echo json_encode(['success' => false, 'error' => 'Unknown action']);
			}
		}
	} catch (Exception $e) {
		echo json_encode(['success' => false, 'error' => $e->getMessage()]);
	}
	exit;
}
?>
<!DOCTYPE html>
<html lang="ru">

<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>CRM System</title>
	<link rel="stylesheet" href="styles.css">
</head>

<body>
	<div class="crm-container">
		<!-- Меню -->
		<nav class="menu">
			<div class="menu-item active" data-section="deals">Сделки</div>
			<div class="menu-item" data-section="contacts">Контакты</div>
			<div class="menu-item" data-section="add">+ Добавить</div>
		</nav>

		<!-- Список -->
		<aside class="list">
			<div class="list-header">
				<h3 id="list-title">Сделки</h3>
				<button class="btn-refresh" onclick="loadList()">🔄</button>
			</div>
			<div class="list-content" id="list-items">
				<!-- Список будет загружен через JavaScript -->
			</div>
		</aside>

		<!-- Содержимое -->
		<main class="content">
			<div class="content-header">
				<h3 id="content-title">Выберите элемент</h3>
				<div class="content-actions">
					<button class="btn-edit hidden" id="btn-edit">✏️ Редактировать</button>
					<button class="btn-delete hidden" id="btn-delete">🗑️ Удалить</button>
				</div>
			</div>

			<div class="content-body" id="content-body">
				<div class="empty-state">Выберите элемент из списка для просмотра деталей</div>
			</div>

			<!-- Формы для добавления/редактирования -->
			<div class="form-container hidden" id="form-container">
				<!-- Форма будет загружена динамически -->
			</div>
		</main>
	</div>

	<!-- Модальное окно -->
	<div class="modal hidden" id="modal">
		<div class="modal-content">
			<div class="modal-header">
				<h3 id="modal-title">Modal Title</h3>
				<span class="modal-close" onclick="closeModal()">×</span>
			</div>
			<div class="modal-body" id="modal-body">
				<!-- Контент модального окна -->
			</div>
		</div>
	</div>

	<script src="script.js"></script>
</body>

</html>