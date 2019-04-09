function kSettings(props) {
  return (
    <Page>
      <Section
        title={
          <Text bold align="center">
            Units | Refresh rate
          </Text>
        }>
        <Select label="Units" settingsKey="units" options={[{ name: "ºC", value: "metric" }, { name: "ºF", value: "imperial" }]} />

        <Select
          label="Refresh rate"
          settingsKey="refreshRate"
          options={[
            { name: "On wake", value: "onWake" },
            { name: "30 min.", value: "30m" },
            { name: "1 h.", value: "1h" },
            { name: "2 h.", value: "2h" },
            { name: "8 h.", value: "8h" },
            { name: "12 h.", value: "12h" },
            { name: "24 h.", value: "24h" }
          ]}
        />
        <Text align="right" italic>
          *Refresh rate has a direct impact on battery drain and data consumption
        </Text>
      </Section>
      <Section
        title={
          <Text bold align="center">
            Location
          </Text>
        }>
        <Toggle
          label="Use device location"
          settingsKey="toggleDeviceLocation"
          onChange={value => {
            if (value) {
              console.log("TCL: kSettings -> value", value);
              props.settingsStorage.setItem("cityName", '{"name":""}');
            }
          }}
        />
        <TextInput label="City name" title="Type desired city name" placeholder="Type desired city name" settingsKey="cityName" disabled={!(props.settings.toggleDeviceLocation === "false")} />
      </Section>
      <Section>
        <Button label="Restore to default" onClick={() => restoreToDefault(props)} />
      </Section>
    </Page>
  );
}

function restoreToDefault(props) {
  props.settingsStorage.clear();
  props.settingsStorage.setItem("units", JSON.stringify({ values: [{ name: "ºC", value: "metric" }], selected: [0] }));
  props.settingsStorage.setItem("refreshRate", JSON.stringify({ values: [{ name: "On wake", value: "onWake" }], selected: [0] }));
  props.settingsStorage.setItem("toggleDeviceLocation", "true");
}

registerSettingsPage(kSettings);
