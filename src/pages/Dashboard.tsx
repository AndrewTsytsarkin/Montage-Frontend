import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import type { ProjectObject, WorkReport } from "../types";
import type { WorkTypeDto } from "../types/Dtos";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [objects, setObjects] = useState<ProjectObject[]>([]);

  useEffect(() => {
    api.get<ProjectObject[]>("/objects").then((res) => setObjects(res.data));
  }, []);

  if (!user) return null;

  return (
    <>
      <WorkReports />
      <div style={{ padding: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <h1>Объекты ({user.role})</h1>
          <button onClick={logout}>Выйти</button>
        </div>
        {user.role === "Admin" && (
          <button
            style={{
              background: "green",
              color: "white",
              marginBottom: "10px",
            }}
          >
            + Добавить
          </button>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "20px",
          }}
        >
          {objects.map((obj) => (
            <div
              key={obj.id}
              style={{
                border: "1px solid #ccc",
                padding: "15px",
                borderRadius: "8px",
              }}
            >
              <h3>{obj.name}</h3>
              <p>{obj.address}</p>
              <p>Статус: {obj.status}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Dashboard;

const WorkReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkTypeDto[]>([]);
  const [objects, setObjects] = useState<ProjectObject[]>([]);
  const [loading, setLoading] = useState(true);

  // Форма создания
  const [selectedObject, setSelectedObject] = useState<number>(0);
  const [selectedWorkType, setSelectedWorkType] = useState<number>(0);
  const [workDate, setWorkDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [comment, setComment] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  // === НОВОЕ: Расчет стоимости в реальном времени ===
  const selectedWorkTypeData = workTypes.find(
    (wt) => wt.id === selectedWorkType,
  );
  const estimatedTotal = selectedWorkTypeData
    ? selectedWorkTypeData.pricePerUnit * quantity
    : 0;

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsRes, workTypesRes, objectsRes] = await Promise.all([
        api.get<WorkReport[]>("/workreports"),
        api.get<WorkTypeDto[]>("/worktypes"),
        api.get<ProjectObject[]>("/objects"),
      ]);
      setReports(reportsRes.data);
      setWorkTypes(workTypesRes.data);
      setObjects(objectsRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedObject || !selectedWorkType) {
      alert("Выберите объект и вид работы");
      return;
    }

    try {
      await api.post("/workreports", {
        objectId: selectedObject,
        workTypeId: selectedWorkType,
        workDate,
        quantity,
        comment,
      });

      // Очистка формы
      setSelectedObject(0);
      setSelectedWorkType(0);
      setQuantity(1);
      setComment("");

      loadData();
      alert("Отчет создан!");
    } catch (error: any) {
      alert(error.response?.data?.message || "Ошибка создания отчета");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить этот отчет?")) return;

    try {
      await api.delete(`/workreports/${id}`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Ошибка удаления");
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Отчеты о выполненных работах</h1>

      {/* Форма создания отчета */}
      <div
        style={{
          background: "#f5f5f5",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h2>Добавить отчет</h2>
        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
          }}
        >
          <div>
            <label>Объект *</label>
            <select
              value={selectedObject}
              onChange={(e) => setSelectedObject(Number(e.target.value))}
              style={{ width: "100%", padding: "8px" }}
              required
            >
              <option value={0}>Выберите объект</option>
              {objects.map((obj) => (
                <option key={obj.id} value={obj.id}>
                  {obj.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Вид работы *</label>
            <select
              value={selectedWorkType}
              onChange={(e) => setSelectedWorkType(Number(e.target.value))}
              style={{ width: "100%", padding: "8px" }}
              required
            >
              <option value={0}>Выберите вид работы</option>
              {workTypes.map((wt) => (
                <option key={wt.id} value={wt.id}>
                  {wt.type} → {wt.subtype}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Дата *</label>
            <input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              style={{ width: "100%", padding: "8px" }}
              required
            />
          </div>

          <div>
            <label>Количество *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              style={{ width: "100%", padding: "8px" }}
              required
            />
          </div>
          {/* === НОВОЕ: Отображение цены === */}
          {selectedWorkTypeData && (
            <div
              style={{
                gridColumn: "1 / -1",
                background: "#e3f2fd",
                padding: "10px",
                borderRadius: "4px",
              }}
            >
              <strong>Цена за единицу:</strong>{" "}
              {selectedWorkTypeData.pricePerUnit} ₽ /{" "}
              {selectedWorkTypeData.unit}
              <br />
              <strong>Итого:</strong>{" "}
              <span style={{ fontSize: "18px", color: "#2e7d32" }}>
                {estimatedTotal.toFixed(2)} ₽
              </span>
            </div>
          )}

          <div style={{ gridColumn: "1 / -1" }}>
            <label>Комментарий</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ width: "100%", padding: "8px", minHeight: "60px" }}
              placeholder="Дополнительная информация..."
            />
          </div>

          <button
            type="submit"
            style={{
              gridColumn: "1 / -1",
              padding: "10px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Создать отчет
          </button>
        </form>
      </div>

      {/* Список отчетов */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <h2>История отчетов ({reports.length})</h2>

        {reports.length === 0 ? (
          <p>Отчетов пока нет</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f0f0f0" }}>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>
                  Дата
                </th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>
                  Объект
                </th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>
                  Вид работы
                </th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>
                  Кол-во
                </th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>
                  Цена за ед.
                </th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>
                  Итого
                </th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>
                  Комментарий
                </th>
                {user?.role === "Admin" && (
                  <th style={{ padding: "10px", border: "1px solid #ddd" }}>
                    Монтажник
                  </th>
                )}
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    {new Date(report.workDate).toLocaleDateString("ru-RU")}
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    {report.objectName}
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    <small>{report.workTypeType}</small>
                    <br />
                    <strong>{report.workTypeName}</strong>
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    {report.quantity} {report.unit}
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    {report.pricePerUnit} ₽
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ddd",
                      fontWeight: "bold",
                      color: "#2e7d32",
                    }}
                  >
                    {report.totalPrice.toFixed(2)} ₽
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    {report.comment || "—"}
                  </td>
                  {user?.role === "Admin" && (
                    <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                      {report.userLogin}
                    </td>
                  )}
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    <button
                      onClick={() => handleDelete(report.id)}
                      style={{
                        background: "#dc3545",
                        color: "white",
                        border: "none",
                        padding: "5px 10px",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
