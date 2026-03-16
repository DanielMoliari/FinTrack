import { useState } from "react";
import Modal from "../ui/Modal";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  getCategorySubcategories,
} from "../../utils/categories";
import { addTransaction } from "../../api/sheets";
import { generateId } from "../../utils/formatters";
import useFinanceStore from "../../store/useFinanceStore";
import styles from "./Modal.module.scss";

const AddTransaction = ({ open, onClose }) => {
  const loadAll = useFinanceStore((s) => s.loadAll);
  const wallets = useFinanceStore((s) => s.wallets).filter((w) => w.ativo);

  const [tipo, setTipo] = useState("saida");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [subcategoria, setSubcategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [carteira, setCarteira] = useState("geral");
  const [metodo, setMetodo] = useState("pix");
  const [isFixed, setIsFixed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cats = tipo === "saida" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const subs = categoria ? getCategorySubcategories(categoria) : [];

  const reset = () => {
    setTipo("saida");
    setValor("");
    setCategoria("");
    setSubcategoria("");
    setDescricao("");
    setCarteira("geral");
    setMetodo("pix");
    setIsFixed(false);
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!valor || parseFloat(valor) <= 0) {
      setError("Informe um valor válido");
      return;
    }
    if (!categoria) {
      setError("Selecione uma categoria");
      return;
    }
    setSaving(true);
    const payload = {
      id: generateId("txn"),
      valor: parseFloat(valor),
      tipo_fluxo: tipo,
      categoria,
      subcategoria,
      descricao,
      metodo_pagamento: metodo,
      carteira_id: carteira,
      is_fixed: isFixed,
    };
    console.log("[AddTransaction] submitting", payload);
    try {
      const res = await addTransaction(payload);
      console.log("[AddTransaction] addTransaction result", res);
      await loadAll();
      handleClose();
    } catch (e) {
      console.error("[AddTransaction] error", e);
      setError(e.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Nova transação">
      {/* Toggle tipo */}
      <div className={styles.toggle}>
        <button
          className={tipo === "saida" ? styles.toggleActive : ""}
          onClick={() => setTipo("saida")}
          type="button"
        >
          Saída
        </button>
        <button
          className={tipo === "entrada" ? styles.toggleActiveIncome : ""}
          onClick={() => setTipo("entrada")}
          type="button"
        >
          Entrada
        </button>
      </div>

      {/* Valor */}
      <div className={styles.valueInput}>
        <span className={styles.currency}>R$</span>
        <input
          type="number"
          placeholder="0,00"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          inputMode="decimal"
          autoFocus
        />
      </div>

      {/* Categoria */}
      <p className={styles.fieldLabel}>Categoria</p>
      <div className={styles.catGrid}>
        {cats.map((cat) => (
          <button
            key={cat.name}
            type="button"
            className={`${styles.catBtn} ${categoria === cat.name ? styles.catActive : ""}`}
            style={
              categoria === cat.name
                ? { borderColor: cat.color, color: cat.color }
                : {}
            }
            onClick={() => {
              setCategoria(cat.name);
              setSubcategoria("");
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Subcategoria */}
      {subs.length > 0 && (
        <>
          <p className={styles.fieldLabel}>Subcategoria</p>
          <select
            className={styles.select}
            value={subcategoria}
            onChange={(e) => setSubcategoria(e.target.value)}
          >
            <option value="">Selecione...</option>
            {subs.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </>
      )}

      {/* Descrição */}
      <p className={styles.fieldLabel}>Descrição (opcional)</p>
      <input
        className={styles.input}
        placeholder="Ex: Almoço com clientes"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
      />

      {/* Carteira */}
      <p className={styles.fieldLabel}>Carteira</p>
      <select
        className={styles.select}
        value={carteira}
        onChange={(e) => setCarteira(e.target.value)}
      >
        {wallets.map((w) => (
          <option key={w.id} value={w.id}>
            {w.nome || w.id}
          </option>
        ))}
      </select>

      {/* Método */}
      <p className={styles.fieldLabel}>Método de pagamento</p>
      <select
        className={styles.select}
        value={metodo}
        onChange={(e) => setMetodo(e.target.value)}
      >
        {PAYMENT_METHODS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>

      {/* Fixed toggle */}
      <div className={styles.toggle2}>
        <span>É fixo?</span>
        <button
          type="button"
          className={`${styles.switchBtn} ${isFixed ? styles.switchOn : ""}`}
          onClick={() => setIsFixed(!isFixed)}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.saveBtnWrap}>
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saving}
          type="button"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </Modal>
  );
};

export default AddTransaction;
