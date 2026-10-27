import {
  Select,
  SelectContent,
  SelectItem,
  SelectList,
  SelectTrigger,
  SelectValue,
} from '@doscientos/ui'

interface SimpleSelectProps<Value extends string> {
  label: string
  value: Value | undefined
  options: ReadonlyArray<{ id: Value; label: string }>
  onChange: (value: Value) => void
  placeholder?: string
  disabled?: boolean
}

/** Select with a flat list of options, for forms that only need to pick one value. */
export function SimpleSelect<Value extends string>({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled,
}: SimpleSelectProps<Value>) {
  return (
    <Select
      aria-label={label}
      {...(placeholder === undefined ? {} : { placeholder })}
      {...(disabled === undefined ? {} : { isDisabled: disabled })}
      selectedKey={value ?? null}
      onSelectionChange={(key) => {
        const option = options.find((candidate) => candidate.id === String(key))
        if (option) onChange(option.id)
      }}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectList items={options}>
          {(option) => <SelectItem id={option.id}>{option.label}</SelectItem>}
        </SelectList>
      </SelectContent>
    </Select>
  )
}
