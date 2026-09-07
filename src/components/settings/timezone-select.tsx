"use client";

import { useState } from "react";

import { Select } from "@/components/ui/select";

/** Client wrapper so the server-rendered settings page can hold a Select. */
export function TimezoneSelect({
  id,
  zones,
  defaultValue,
}: {
  id: string;
  zones: readonly string[];
  defaultValue: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <Select
      id={id}
      label="Timezone"
      hideLabel={false}
      value={value}
      onChange={setValue}
      options={zones.map((zone) => ({ value: zone, label: zone }))}
    />
  );
}
