import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
} from '@doscientos/ui'
import { MapPin, Package, UserRound } from 'lucide-react'
import { useId } from 'react'

import type { Product } from '@/features/catalog'

import type { Order } from '../application/order'
import type { OrderIssue, OrderIssueField } from '../application/validation'
import { OrderLinesEditor } from './order-lines-editor'
import { OrderSourceFields } from './order-source-fields'

export type OrderFormValue = Pick<Order, 'customer' | 'address' | 'lines' | 'marketplace' | 'source'>

interface OrderDataFormProps {
  value: OrderFormValue
  issues: OrderIssue[]
  products: Product[]
  disabled?: boolean
  onChange: (value: OrderFormValue) => void
}

interface TextFieldProps {
  label: string
  value: string
  /** Validation field this input reports on; omit for free-form fields. */
  field?: OrderIssueField
  /** Marks the input invalid without repeating a message shown elsewhere. */
  hideMessage?: boolean
  issues: OrderIssue[]
  disabled: boolean
  type?: string
  placeholder: string
  autoComplete?: string
  inputMode?: 'numeric'
  describedBy?: string
  onChange: (value: string) => void
}

function TextField({
  label,
  value,
  field,
  hideMessage = false,
  issues,
  disabled,
  type,
  placeholder,
  autoComplete,
  inputMode,
  describedBy,
  onChange,
}: TextFieldProps) {
  const id = useId()
  const issue = field ? issues.find((candidate) => candidate.field === field) : undefined
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        value={value}
        disabled={disabled}
        aria-invalid={issue ? true : undefined}
        aria-describedby={issue && !hideMessage ? `${id}-error` : describedBy}
        onChange={(event) => onChange(event.target.value)}
      />
      {issue && !hideMessage ? <FieldError id={`${id}-error`}>{issue.message}</FieldError> : null}
    </Field>
  )
}

export function OrderDataForm({
  value,
  issues,
  products,
  disabled = false,
  onChange,
}: OrderDataFormProps) {
  const contactHelpId = useId()
  const setCustomer = (patch: Partial<Order['customer']>) =>
    onChange({ ...value, customer: { ...value.customer, ...patch } })
  const setAddress = (patch: Partial<Order['address']>) =>
    onChange({ ...value, address: { ...value.address, ...patch } })
  const shared = { issues, disabled }
  const contactIssue = issues.filter((issue) => issue.field === 'customer.contact')

  return (
    <FieldGroup className="min-w-0 gap-7">
      <OrderSourceFields
        source={value.source}
        marketplace={value.marketplace}
        disabled={disabled}
        onChange={(patch) => onChange({ ...value, ...patch })}
      />
      <FieldSet className="min-w-0 gap-3">
        <FieldLegend>
          <span className="inline-flex items-center gap-2">
            <UserRound aria-hidden className="text-muted-foreground size-4" />
            Cliente
          </span>
        </FieldLegend>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <TextField
            {...shared}
            label="Nombre o razón social"
            placeholder="Ej. Hotel Costa Brava SL"
            autoComplete="name"
            field="customer.name"
            value={value.customer.name}
            onChange={(name) => setCustomer({ name })}
          />
          <TextField
            {...shared}
            label="NIF / CIF"
            placeholder="Ej. B12345678"
            value={value.customer.taxId}
            onChange={(taxId) => setCustomer({ taxId })}
          />
          <TextField
            {...shared}
            hideMessage
            label="Email"
            type="email"
            placeholder="nombre@empresa.com"
            autoComplete="email"
            describedBy={contactHelpId}
            field="customer.contact"
            value={value.customer.email}
            onChange={(email) => setCustomer({ email })}
          />
          <TextField
            {...shared}
            hideMessage
            label="Teléfono"
            type="tel"
            placeholder="Ej. 600 123 456"
            autoComplete="tel"
            describedBy={contactHelpId}
            field="customer.contact"
            value={value.customer.phone}
            onChange={(phone) => setCustomer({ phone })}
          />
        </div>
        {contactIssue.length > 0 ? (
          <FieldError id={contactHelpId}>{contactIssue[0]?.message}</FieldError>
        ) : (
          <FieldDescription id={contactHelpId} className="text-xs">
            Indica al menos un email o un teléfono. El NIF / CIF es opcional.
          </FieldDescription>
        )}
      </FieldSet>
      <FieldSet className="min-w-0 gap-3">
        <FieldLegend>
          <span className="inline-flex items-center gap-2">
            <MapPin aria-hidden className="text-muted-foreground size-4" />
            Dirección de entrega
          </span>
        </FieldLegend>
        <div className="grid min-w-0 gap-4 sm:grid-cols-6">
          <div className="sm:col-span-6">
            <TextField
              {...shared}
              label="Dirección"
              placeholder="Calle, número, piso o local"
              autoComplete="street-address"
              field="address.street"
              value={value.address.street}
              onChange={(street) => setAddress({ street })}
            />
          </div>
          <div className="sm:col-span-6">
            <TextField
              {...shared}
              label="Dirección adicional"
              placeholder="Piso, local u otras indicaciones"
              value={value.address.street2 ?? ''}
              onChange={(street2) => setAddress({ street2 })}
            />
          </div>
          <div className="sm:col-span-2">
            <TextField
              {...shared}
              label="Código postal"
              placeholder="Ej. 08001"
              autoComplete="postal-code"
              inputMode="numeric"
              field="address.postalCode"
              value={value.address.postalCode}
              onChange={(postalCode) => setAddress({ postalCode })}
            />
          </div>
          <div className="sm:col-span-4">
            <TextField
              {...shared}
              label="Población"
              placeholder="Ej. Barcelona"
              autoComplete="address-level2"
              field="address.city"
              value={value.address.city}
              onChange={(city) => setAddress({ city })}
            />
          </div>
          <div className="sm:col-span-3">
            <TextField
              {...shared}
              label="Provincia"
              placeholder="Ej. Córdoba"
              autoComplete="address-level1"
              value={value.address.province ?? ''}
              onChange={(province) => setAddress({ province })}
            />
          </div>
          <div className="sm:col-span-3">
            <TextField
              {...shared}
              label="País (código ISO)"
              placeholder="Ej. ES"
              autoComplete="country"
              value={value.address.country}
              onChange={(country) => setAddress({ country: country.toUpperCase() })}
            />
          </div>
        </div>
      </FieldSet>
      <FieldSet className="min-w-0 gap-3">
        <FieldLegend>
          <span className="inline-flex items-center gap-2">
            <Package aria-hidden className="text-muted-foreground size-4" />
            Artículos
          </span>
        </FieldLegend>
        <OrderLinesEditor
          lines={value.lines}
          products={products}
          issues={issues}
          disabled={disabled}
          onChange={(lines) => onChange({ ...value, lines })}
        />
        {issues.some((issue) => issue.field === 'lines') ? (
          <FieldError>El pedido no tiene artículos.</FieldError>
        ) : null}
      </FieldSet>
    </FieldGroup>
  )
}
