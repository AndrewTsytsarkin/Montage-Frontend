// src/pages/WorkReports.tsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

import WorkTypeTreeSelect from "../components/WorkTypeTreeSelect";
import { useObjectSelection } from "../context/src/context/ObjectSelectionContext";
import type { WorkReport } from "../types";
import type { WorkTypeDto } from "../types/Dtos";

const WorkReports = () => {
  const { user, logout } = useAuth();
  const { selectedObject, clearSelection } = useObjectSelection();
  const navigate = useNavigate();

  const [reports, setReports] = useState<WorkReport[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkTypeDto[]>([]);
  const [loading, setLoading] = useState(true);

  // === ФИЛЬТР ПО ДАТЕ (ПО УМОЛЧАНИЮ СЕГОДНЯ) ===
  const today = new Date().toISOString().split("T")[0];
  const [filterDate, setFilterDate] = useState<string>(today);

  // Поля формы
  const [selectedWorkType, setSelectedWorkType] = useState<number>(0);
  const [workDate, setWorkDate] = useState<string>(today);
  const [quantity, setQuantity] = useState<number>(1);
  const [comment, setComment] = useState<string>("");

  // === ПРОВЕРКА ДУБЛИКАТОВ ===
  const [   , setDuplicateError] = useState<string>("");

  // === РЕДАКТИРОВАНИЕ В ТАБЛИЦЕ ===
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<number>(1);
  const [editingComment, setEditingComment] = useState<string>("");

  // === ФИЛЬТРАЦИЯ РАБОТ ПО ДАТЕ ===
  const filteredReports = useMemo(() => {
    if (!filterDate) {
      return reports;
    }
    return reports.filter((report) => {
      const reportDate = report.workDate.split("T")[0];
      return reportDate === filterDate;
    });
  }, [reports, filterDate]);

  // === СТАТИСТИКА ПО ФИЛЬТРУ ===
  const filterStats = useMemo(() => {
    const total = filteredReports.reduce((sum, r) => sum + r.totalPrice, 0);
    const count = filteredReports.length;
    return { total, count };
  }, [filteredReports]);

  // === ПРОВЕРКА НА ДУБЛИКАТ (workTypeId + workDate) ===
  const isDuplicate = useMemo(() => {
    if (!selectedWorkType || !workDate) return false;

    return reports.some(
      (report) =>
        report.workTypeId === selectedWorkType &&
        report.workDate.split("T")[0] === workDate,
    );
  }, [reports, selectedWorkType, workDate]);

  // === НАЙТИ ДУБЛИКАТ (для отображения информации) ===
  const existingDuplicate = useMemo(() => {
    if (!selectedWorkType || !workDate) return null;

    return reports.find(
      (report) =>
        report.workTypeId === selectedWorkType &&
        report.workDate.split("T")[0] === workDate,
    );
  }, [reports, selectedWorkType, workDate]);

  const selectedWorkTypeData = workTypes.find(
    (wt) => wt.id === selectedWorkType,
  );
  const estimatedTotal = selectedWorkTypeData
    ? selectedWorkTypeData.pricePerUnit * quantity
    : 0;

  // Загрузка данных
  useEffect(() => {
    if (!selectedObject) {
      navigate("/objects");
      return;
    }
    loadData();
  }, [selectedObject]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsRes, workTypesRes] = await Promise.all([
        api.get<WorkReport[]>(`/workreports?objectId=${selectedObject?.id}`),
        api.get<WorkTypeDto[]>("/worktypes"),
      ]);
      setReports(reportsRes.data);
      setWorkTypes(workTypesRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // === ОЧИСТКА ФИЛЬТРА ===
  const clearDateFilter = () => {
    setFilterDate("");
  };

  // === УСТАНОВИТЬ ФИЛЬТР НА СЕГОДНЯ ===
  const setFilterToToday = () => {
    setFilterDate(today);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedWorkType || !selectedObject) {
      alert("Выберите вид работы");
      return;
    }

    // === ПРОВЕРКА НА ДУБЛИКАТ ===
    if (isDuplicate) {
      setDuplicateError(
        `⚠️ Такая работа уже добавлена на ${new Date(workDate).toLocaleDateString("ru-RU")}`,
      );
      return;
    }

    try {
      await api.post("/workreports", {
        objectId: selectedObject.id,
        workTypeId: selectedWorkType,
        workDate,
        quantity,
        comment,
      });

      setSelectedWorkType(0);
      setQuantity(1);
      setComment("");
      setDuplicateError("");

      loadData();
      alert("Работа добавлена!");
    } catch (error: any) {
      alert(error.response?.data?.message || "Ошибка добавления работы");
    }
  };

  // === НАЧАТЬ РЕДАКТИРОВАНИЕ ===
  const startEditing = (report: WorkReport) => {
    setEditingId(report.id);
    setEditingQuantity(report.quantity);
    setEditingComment(report.comment || "");
  };

  // === СОХРАНИТЬ РЕДАКТИРОВАНИЕ ===
  const saveEditing = async (id: number) => {
    try {
      await api.put(`/workreports/${id}`, {
        quantity: editingQuantity,
        comment: editingComment,
      });
      setEditingId(null);
      loadData();
      alert("Работа обновлена!");
    } catch (error: any) {
      alert(error.response?.data?.message || "Ошибка обновления");
    }
  };

  // === ОТМЕНА РЕДАКТИРОВАНИЯ ===
  const cancelEditing = () => {
    setEditingId(null);
    setEditingQuantity(1);
    setEditingComment("");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить эту работу?")) return;
    try {
      await api.delete(`/workreports/${id}`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Ошибка удаления");
    }
  };

  const handleChangeObject = () => {
    clearSelection();
    navigate("/objects");
  };

  // === ОЧИСТКА ОШИБКИ ДУБЛИКАТА ===
  useEffect(() => {
    setDuplicateError("");
  }, [selectedWorkType, workDate]);

  if (!selectedObject) return <div>Перенаправление...</div>;
  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>Загрузка...</div>
    );

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Шапка объекта */}
      <div
        style={{
          background: "linear-gradient(135deg, #007bff 0%, #0056b3 100%)",
          color: "white",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1 style={{ margin: "0 0 10px 0" }}>{selectedObject.name}</h1>
            <p style={{ margin: "5px 0", opacity: 0.9 }}>
              📍 {selectedObject.address}
            </p>
            <p style={{ margin: "5px 0", opacity: 0.9 }}>
              <span
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                }}
              >
                {selectedObject.status}
              </span>
            </p>
            <p
              style={{
                margin: "10px 0 0 0",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              👤 {user?.fullName || user?.login}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleChangeObject}
              style={{
                padding: "10px 20px",
                background: "rgba(255,255,255,0.2)",
                color: "white",
                border: "1px solid white",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              🔄 Сменить объект
            </button>
            <button
              onClick={logout}
              style={{
                padding: "10px 20px",
                background: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Выйти
            </button>
          </div>
        </div>
      </div>

      {/* Форма добавления работы */}
      <div
        style={{
          background: "#f5f5f5",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h2>📝 Добавить работу</h2>
        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "15px",
          }}
        >
          {/* Дерево выбора вида работы */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                fontWeight: "bold",
                fontSize: "16px",
              }}
            >
              🔧 Выберите вид работы *
            </label>
            <WorkTypeTreeSelect
              workTypes={workTypes}
              selectedValue={selectedWorkType}
              onChange={setSelectedWorkType}
            />
          </div>

          {/* Дата */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              📅 Дата работы *
            </label>
            <input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              max={today}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "4px",
                border: isDuplicate ? "2px solid #f44336" : "1px solid #ddd",
                fontSize: "14px",
                cursor: "pointer",
              }}
              required
            />
            <small style={{ color: "#999", fontSize: "12px" }}>
              ⚠️ Нельзя выбрать будущую дату
            </small>
          </div>

          {/* Количество — ТОЛЬКО ЦЕЛЫЕ ЧИСЛА */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              🔢 Количество (шт) *
            </label>
            <input
              type="number"
              step="1"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.floor(Number(e.target.value)))}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                fontSize: "14px",
              }}
              required
            />
            <small style={{ color: "#999", fontSize: "12px" }}>
              ⚠️ Только целые числа
            </small>
          </div>

          {/* === БЛОК ОШИБКИ ДУБЛИКАТА === */}
          {isDuplicate && existingDuplicate && (
            <div
              style={{
                gridColumn: "1 / -1",
                background: "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)",
                padding: "15px 20px",
                borderRadius: "8px",
                border: "2px solid #f44336",
                display: "flex",
                alignItems: "center",
                gap: "15px",
              }}
            >
              <span style={{ fontSize: "24px" }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: "0 0 5px 0",
                    fontWeight: "bold",
                    color: "#c62828",
                  }}
                >
                  Такая работа уже добавлена на эту дату!
                </p>
                <p style={{ margin: "0", fontSize: "13px", color: "#666" }}>
                  <strong>Вид работы:</strong> {existingDuplicate.workTypeName}
                  <br />
                  <strong>Количество:</strong> {existingDuplicate.quantity}{" "}
                  {existingDuplicate.unit}
                  <br />
                  <strong>Сумма:</strong>{" "}
                  {existingDuplicate.totalPrice.toFixed(2)} ₽<br />
                  {existingDuplicate.comment && (
                    <>
                      <strong>Комментарий:</strong> {existingDuplicate.comment}
                    </>
                  )}
                </p>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "5px" }}
              >
                <button
                  type="button"
                  onClick={() => {
                    startEditing(existingDuplicate);
                    // Прокрутка к таблице
                    document
                      .querySelector("table")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "#2196f3",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "13px",
                  }}
                >
                  ✏️ Редактировать
                </button>
              </div>
            </div>
          )}

          {/* Отображение цены */}
          {selectedWorkTypeData && !isDuplicate && (
            <div
              style={{
                gridColumn: "1 / -1",
                background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
                padding: "20px",
                borderRadius: "8px",
                border: "2px solid #4caf50",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "15px",
                }}
              >
                <div>
                  <p
                    style={{ margin: "5px 0", fontSize: "14px", color: "#555" }}
                  >
                    <strong>💰 Цена за единицу:</strong>{" "}
                    {selectedWorkTypeData.pricePerUnit} ₽ /{" "}
                    {selectedWorkTypeData.unit}
                  </p>
                  <p
                    style={{ margin: "5px 0", fontSize: "14px", color: "#555" }}
                  >
                    <strong>🔢 Количество:</strong> {quantity}{" "}
                    {selectedWorkTypeData.unit}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p
                    style={{ margin: "5px 0", fontSize: "14px", color: "#555" }}
                  >
                    Итоговая стоимость:
                  </p>
                  <p
                    style={{
                      margin: "0",
                      fontSize: "32px",
                      color: "#2e7d32",
                      fontWeight: "bold",
                    }}
                  >
                    {estimatedTotal.toFixed(2)} ₽
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Комментарий */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              💬 Комментарий
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isDuplicate}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                minHeight: "80px",
                fontSize: "14px",
                fontFamily: "inherit",
                background: isDuplicate ? "#f5f5f5" : "white",
                cursor: isDuplicate ? "not-allowed" : "text",
              }}
              placeholder={
                isDuplicate
                  ? "Сначала удалите или измените существующую работу"
                  : "Дополнительная информация..."
              }
            />
          </div>

          {/* Кнопка */}
          <button
            type="submit"
            disabled={!selectedWorkType || isDuplicate}
            style={{
              gridColumn: "1 / -1",
              padding: "14px",
              background: !selectedWorkType || isDuplicate ? "#ccc" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor:
                !selectedWorkType || isDuplicate ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            {isDuplicate
              ? "⛔ Работа уже добавлена на эту дату"
              : "✓ Добавить работу"}
          </button>
        </form>
      </div>

      {/* === ИСТОРИЯ ВЫПОЛНЕННЫХ РАБОТ === */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {/* === ФИЛЬТР ПО ДАТЕ === */}
        <div
          style={{
            background: "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
            padding: "15px 20px",
            borderRadius: "8px",
            marginBottom: "10px",
            border: "2px solid #ff9800",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "15px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >
            <label
              style={{ fontWeight: "bold", color: "#e65100", fontSize: "16px" }}
            >
              🔍 Фильтр по дате:
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              max={today}
              style={{
                padding: "10px 15px",
                borderRadius: "6px",
                border: "2px solid #ff9800",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                background: "white",
              }}
            />
            {filterDate && filterDate !== today && (
              <button
                onClick={setFilterToToday}
                style={{
                  padding: "10px 15px",
                  background: "#4caf50",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
              >
                📅 Сегодня
              </button>
            )}
            {filterDate && (
              <button
                onClick={clearDateFilter}
                style={{
                  padding: "10px 15px",
                  background: "#ff5722",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
              >
                ✕ Сбросить
              </button>
            )}
          </div>

          {/* Статистика */}
          <div
            style={{
              display: "flex",
              gap: "20px",
              fontSize: "14px",
              color: "#e65100",
              fontWeight: "bold",
            }}
          >
            <span>
              📊 Работ:{" "}
              <span style={{ color: "#bf360c" }}>{filterStats.count}</span>
            </span>
            <span>
              💰 Сумма:{" "}
              <span style={{ color: "#bf360c" }}>
                {filterStats.total.toFixed(2)} ₽
              </span>
            </span>
          </div>
        </div>

        {/* Заголовок таблицы */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2>📊 История выполненных работ ({filteredReports.length})</h2>
          {filterDate && (
            <span
              style={{
                padding: "6px 12px",
                background: "#ff9800",
                color: "white",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "bold",
              }}
            >
              📅{" "}
              {filterDate === today
                ? "Сегодня"
                : new Date(filterDate).toLocaleDateString("ru-RU")}
            </span>
          )}
        </div>

        {/* Таблица работ */}
        {filteredReports.length === 0 ? (
          <div
            style={{
              background: "#f8f9fa",
              padding: "30px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "16px", color: "#666" }}>
              {filterDate
                ? `🔍 Работ на ${new Date(filterDate).toLocaleDateString("ru-RU")} не найдено`
                : "Выполненных работ по этому объекту пока нет"}
            </p>
            {filterDate && filterDate !== today && (
              <button
                onClick={setFilterToToday}
                style={{
                  marginTop: "10px",
                  padding: "8px 16px",
                  background: "#4caf50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Показать работы за сегодня
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <thead>
                <tr style={{ background: "#007bff", color: "white" }}>
                  <th style={{ padding: "12px", border: "1px solid #ddd" }}>
                    Дата
                  </th>
                  <th style={{ padding: "12px", border: "1px solid #ddd" }}>
                    Вид работы
                  </th>
                  <th style={{ padding: "12px", border: "1px solid #ddd" }}>
                    Кол-во
                  </th>
                  <th style={{ padding: "12px", border: "1px solid #ddd" }}>
                    Цена
                  </th>
                  <th style={{ padding: "12px", border: "1px solid #ddd" }}>
                    Итого
                  </th>
                  <th style={{ padding: "12px", border: "1px solid #ddd" }}>
                    Комментарий
                  </th>
                  {user?.role === "Admin" && (
                    <th style={{ padding: "12px", border: "1px solid #ddd" }}>
                      Монтажник
                    </th>
                  )}
                  <th style={{ padding: "12px", border: "1px solid #ddd" }}>
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => {
                  const isEditing = editingId === report.id;
                  const currentQuantity = isEditing
                    ? editingQuantity
                    : report.quantity;
          
                  const currentTotal = currentQuantity * report.pricePerUnit;

                  return (
                    <tr
                      key={report.id}
                      style={{ transition: "background 0.2s" }}
                    >
                      <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                        {new Date(report.workDate).toLocaleDateString("ru-RU")}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          border: "1px solid #ddd",
                          maxWidth: "250px",
                        }}
                      >
                        <small style={{ color: "#666" }}>
                          {report.workTypeType}
                        </small>
                        <br />
                        <strong>{report.workTypeName}</strong>
                      </td>
                      <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                        {isEditing ? (
                          <input
                            type="number"
                            step="1"
                            min="1"
                            value={editingQuantity}
                            onChange={(e) =>
                              setEditingQuantity(
                                Math.max(1, Math.floor(Number(e.target.value))),
                              )
                            }
                            style={{
                              width: "70px",
                              padding: "6px",
                              borderRadius: "4px",
                              border: "2px solid #2196f3",
                              fontSize: "14px",
                              fontWeight: "bold",
                            }}
                          />
                        ) : (
                          <span style={{ fontWeight: "bold" }}>
                            {report.quantity} {report.unit}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                        {report.pricePerUnit} ₽
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          border: "1px solid #ddd",
                          fontWeight: "bold",
                          color: "#2e7d32",
                        }}
                      >
                        {currentTotal.toFixed(2)} ₽
                        {isEditing && (
                          <span
                            style={{
                              display: "block",
                              fontSize: "11px",
                              color: "#ff9800",
                            }}
                          >
                            (было: {report.totalPrice.toFixed(2)} ₽)
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          border: "1px solid #ddd",
                          maxWidth: "250px",
                        }}
                      >
                        {isEditing ? (
                          <textarea
                            value={editingComment}
                            onChange={(e) => setEditingComment(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "6px",
                              borderRadius: "4px",
                              border: "2px solid #2196f3",
                              fontSize: "13px",
                              minHeight: "60px",
                              fontFamily: "inherit",
                              resize: "vertical",
                            }}
                            placeholder="Введите комментарий..."
                          />
                        ) : (
                          <span
                            style={{ color: report.comment ? "#333" : "#999" }}
                          >
                            {report.comment || "—"}
                          </span>
                        )}
                      </td>
                      {user?.role === "Admin" && (
                        <td
                          style={{ padding: "12px", border: "1px solid #ddd" }}
                        >
                          {report.userLogin}
                        </td>
                      )}
                      <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: "5px" }}>
                            <button
                              onClick={() => saveEditing(report.id)}
                              style={{
                                background: "#4caf50",
                                color: "white",
                                border: "none",
                                padding: "6px 10px",
                                borderRadius: "4px",
                                cursor: "pointer",
                              }}
                              title="Сохранить"
                            >
                              ✓
                            </button>
                            <button
                              onClick={cancelEditing}
                              style={{
                                background: "#9e9e9e",
                                color: "white",
                                border: "none",
                                padding: "6px 10px",
                                borderRadius: "4px",
                                cursor: "pointer",
                              }}
                              title="Отмена"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: "5px" }}>
                            <button
                              onClick={() => startEditing(report)}
                              style={{
                                background: "#2196f3",
                                color: "white",
                                border: "none",
                                padding: "6px 10px",
                                borderRadius: "4px",
                                cursor: "pointer",
                              }}
                              title="Редактировать"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(report.id)}
                              style={{
                                background: "#dc3545",
                                color: "white",
                                border: "none",
                                padding: "6px 10px",
                                borderRadius: "4px",
                                cursor: "pointer",
                              }}
                              title="Удалить"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkReports;
