const tabs = ['Pacientes', 'Atendimentos', 'Convênios'];

export default function MenuTabs({ currentTab, onChange }) {
  return (
    <nav style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #ccc',
            backgroundColor: currentTab === tab ? '#0d6efd' : '#fff',
            color: currentTab === tab ? '#fff' : '#222'
          }}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
}
