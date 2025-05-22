const ManualLocationForm = ({ error, currentLocation, manualLocation, setManualLocation, handleManualLocationSubmit }) => {
    if (!error || currentLocation) return null;
  
    return (
      <div className="manual-location">
        <h3>Entrer la position manuellement</h3>
        <form onSubmit={handleManualLocationSubmit}>
          <input
            type="text"
            placeholder="Latitude"
            value={manualLocation.lat}
            onChange={(e) => setManualLocation({ ...manualLocation, lat: e.target.value })}
          />
          <input
            type="text"
            placeholder="Longitude"
            value={manualLocation.lon}
            onChange={(e) => setManualLocation({ ...manualLocation, lon: e.target.value })}
          />
          <button type="submit">Définir la position</button>
        </form>
      </div>
    );
  };
  
  export default ManualLocationForm;
