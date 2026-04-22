
const JsonViewer = ({ data }) => {
  const renderData = (key, value) => {
    if (Array.isArray(value)) {
      return (
        <ul>
          {value.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
    } else if (typeof value === 'object' && value !== null) {
      return <JsonViewer data={value} />;
    } else {
      return <span>{value.toString()}</span>;
    }
  };

  return (
    <div className="json-viewer">
      <ul>
        {Object.entries(data).map(([key, value]) => (
          <li key={key}>
            <strong>{key}:</strong> {renderData(key, value)}
          </li>
        ))}
      </ul>
    </div>
  );
};



export default JsonViewer;