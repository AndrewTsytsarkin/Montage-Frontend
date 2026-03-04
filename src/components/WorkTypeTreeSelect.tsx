import { useState, useMemo } from "react";
import type { WorkTypeDto } from "../types/Dtos";
interface WorkTypeTreeSelectProps {
  workTypes: WorkTypeDto[];
  selectedValue: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const WorkTypeTreeSelect = ({
  workTypes,
  selectedValue,
  onChange,
  disabled = false,
}: WorkTypeTreeSelectProps) => {
  // Состояние раскрытых элементов
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [expandedSubtypes, setExpandedSubtypes] = useState<Set<string>>(
    new Set(),
  );

  // Группировка данных
  const groupedData = useMemo(() => {
    const groups: Map<string, Map<string, WorkTypeDto[]>> = new Map();

    workTypes.forEach((wt) => {
      if (!groups.has(wt.type)) {
        groups.set(wt.type, new Map());
      }
      const subtypes = groups.get(wt.type)!;
      if (!subtypes.has(wt.subtype)) {
        subtypes.set(wt.subtype, []);
      }
      subtypes.get(wt.subtype)!.push(wt);
    });

    return groups;
  }, [workTypes]);

  // Переключатель Типа
  const toggleType = (type: string) => {
    if (disabled) return;
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Переключатель Подтипа
  const toggleSubtype = (type: string, subtype: string) => {
    if (disabled) return;
    const key = `${type}_${subtype}`;
    setExpandedSubtypes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Выбор вида работы
  const selectWorkType = (workTypeId: number) => {
    if (disabled) return;
    onChange(workTypeId);
  };

  // Получаем выбранную работу для отображения
  const selectedWorkType = workTypes.find((wt) => wt.id === selectedValue);

  return (
    <div style={{ width: "100%" }}>
      {/* Отображение выбранного элемента */}
      {selectedWorkType && (
        <div
          style={{
            padding: "15px",
            background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
            border: "2px solid #2196f3",
            borderRadius: "8px",
            marginBottom: "15px",
          }}
        >
          <p style={{ margin: "0", fontSize: "14px", color: "#555" }}>
            <strong>✅ Выбрано:</strong>
          </p>
          <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: "#333" }}>
            {selectedWorkType.type} → {selectedWorkType.subtype}
          </p>
          <p
            style={{
              margin: "5px 0 0 0",
              fontSize: "13px",
              color: "#333",
              fontWeight: "bold",
            }}
          >
            🔧 {selectedWorkType.name}
          </p>
          <p
            style={{
              margin: "5px 0 0 0",
              fontSize: "16px",
              color: "#2e7d32",
              fontWeight: "bold",
            }}
          >
            💰 {selectedWorkType.pricePerUnit} ₽ / {selectedWorkType.unit}
          </p>
        </div>
      )}

      {/* Дерево выбора */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          background: "white",
          maxHeight: "500px",
          overflowY: "auto",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        {/* Заголовок дерева */}
        <div
          style={{
            padding: "12px 15px",
            background: "#f5f5f5",
            borderBottom: "2px solid #ddd",
            fontWeight: "bold",
            color: "#333",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          📋 Справочник видов работ
        </div>

        {Array.from(groupedData.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([type, subtypes]) => {
            const isTypeExpanded = expandedTypes.has(type);
            const typeHasSelection = Array.from(subtypes.values())
              .flat()
              .some((wt) => wt.id === selectedValue);

            return (
              <div key={type}>
                {/* === УРОВЕНЬ 1: ТИП === */}
                <div
                  onClick={() => toggleType(type)}
                  style={{
                    padding: "12px 15px",
                    background: typeHasSelection
                      ? "#e3f2fd"
                      : isTypeExpanded
                        ? "#f5f5f5"
                        : "white",
                    borderBottom: "1px solid #eee",
                    cursor: disabled ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontWeight: "bold",
                    color: typeHasSelection ? "#007bff" : "#333",
                    transition: "background 0.2s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>
                      {isTypeExpanded ? "📂" : "📁"}
                    </span>
                    <span>{type}</span>
                    {typeHasSelection && (
                      <span
                        style={{
                          padding: "2px 8px",
                          background: "#007bff",
                          color: "white",
                          borderRadius: "12px",
                          fontSize: "11px",
                        }}
                      >
                        ✓ Выбрано
                      </span>
                    )}
                  </div>
                  <span style={{ color: "#999", fontSize: "12px" }}>
                    {isTypeExpanded ? "−" : "+"}
                  </span>
                </div>

                {/* === УРОВЕНЬ 2: ПОДТИПЫ === */}
                {isTypeExpanded && (
                  <div style={{ background: "#fafafa" }}>
                    {Array.from(subtypes.entries())
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([subtype, works]) => {
                        const subtypeKey = `${type}_${subtype}`;
                        const isSubtypeExpanded =
                          expandedSubtypes.has(subtypeKey);
                        const subtypeHasSelection = works.some(
                          (wt) => wt.id === selectedValue,
                        );

                        return (
                          <div key={subtypeKey}>
                            <div
                              onClick={() => toggleSubtype(type, subtype)}
                              style={{
                                padding: "10px 15px 10px 45px",
                                background: subtypeHasSelection
                                  ? "#bbdefb"
                                  : isSubtypeExpanded
                                    ? "#f0f0f0"
                                    : "#fafafa",
                                borderBottom: "1px solid #eee",
                                cursor: disabled ? "default" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                fontWeight: "600",
                                color: subtypeHasSelection ? "#007bff" : "#555",
                                transition: "background 0.2s",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                }}
                              >
                                <span style={{ fontSize: "14px" }}>
                                  {isSubtypeExpanded ? "📂" : "📁"}
                                </span>
                                <span>{subtype}</span>
                                {subtypeHasSelection && (
                                  <span
                                    style={{
                                      padding: "2px 6px",
                                      background: "#007bff",
                                      color: "white",
                                      borderRadius: "12px",
                                      fontSize: "10px",
                                    }}
                                  >
                                    ✓
                                  </span>
                                )}
                              </div>
                              <span style={{ color: "#999", fontSize: "11px" }}>
                                {isSubtypeExpanded ? "−" : "+"}
                              </span>
                            </div>

                            {/* === УРОВЕНЬ 3: ВИДЫ РАБОТ (с ценой!) === */}
                            {isSubtypeExpanded && (
                              <div style={{ background: "white" }}>
                                {works.map((wt) => {
                                  const isSelected = wt.id === selectedValue;
                                  return (
                                    <div
                                      key={wt.id}
                                      onClick={() => selectWorkType(wt.id)}
                                      style={{
                                        padding: "12px 15px 12px 75px",
                                        background: isSelected
                                          ? "#e3f2fd"
                                          : "white",
                                        borderBottom: "1px solid #f5f5f5",
                                        cursor: disabled
                                          ? "default"
                                          : "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        fontSize: "13px",
                                        color: isSelected ? "#007bff" : "#333",
                                        transition: "background 0.2s",
                                        lineHeight: "1.4",
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!isSelected && !disabled) {
                                          e.currentTarget.style.background =
                                            "#f9f9f9";
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!isSelected && !disabled) {
                                          e.currentTarget.style.background =
                                            "white";
                                        }
                                      }}
                                    >
                                      <div
                                        style={{
                                          flex: 1,
                                          paddingRight: "15px",
                                        }}
                                      >
                                        <span style={{ marginRight: "8px" }}>
                                          🔧
                                        </span>
                                        <span style={{ color: "#555" }}>
                                          {wt.name}
                                        </span>
                                      </div>

                                      {/* === ЦЕНА В СПИСКЕ === */}
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "10px",
                                          flexShrink: 0,
                                        }}
                                      >
                                        <span
                                          style={{
                                            fontSize: "12px",
                                            color: "#999",
                                          }}
                                        >
                                          {wt.unit}
                                        </span>
                                        <div
                                          style={{
                                            padding: "6px 12px",
                                            background: isSelected
                                              ? "#28a745"
                                              : "#e8f5e9",
                                            color: isSelected
                                              ? "white"
                                              : "#2e7d32",
                                            borderRadius: "6px",
                                            fontSize: "13px",
                                            fontWeight: "bold",
                                            whiteSpace: "nowrap",
                                            minWidth: "100px",
                                            textAlign: "center",
                                            border: isSelected
                                              ? "2px solid #1b5e20"
                                              : "1px solid #4caf50",
                                            transition: "all 0.2s",
                                          }}
                                        >
                                          💰 {wt.pricePerUnit} ₽
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Скрытый select для валидации формы */}
      <select
        value={selectedValue || ""}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ position: "absolute", left: "-9999px", top: "-9999px" }}
        tabIndex={-1}
        aria-hidden="true"
        required
      >
        <option value="">Выберите вид работы</option>
        {workTypes.map((wt) => (
          <option key={wt.id} value={wt.id}>
            {wt.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default WorkTypeTreeSelect;
