import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
} from '@doscientos/ui'
import { useId } from 'react'

import type { Product } from '@/features/catalog'

import type { Order } from '../application/order'
import type { OrderIssue, OrderIssueField } from '../application/validation'
import { OrderLinesEditor } from './order-lines-editor'

export type OrderFormValue = Pick<Order, 'customer' | 'address' | 'lines'>

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
        value={value}
        disabled={disabled}
        aria-invalid={issue ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {issue && !hideMessage ? <FieldError>{issue.message}</FieldError> : null}
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
  const setCustomer = (patch: Partial<Order['customer']>) =>
    onChange({ ...value, customer: { ...value.customer, ...patch } })
  const setAddress = (patch: Partial<Order['address']>) =>
    onChange({ ...value, address: { ...value.address, ...patch } })
  const shared = { issues, disabled }
  const contactIssue = issues.filter((issue) => issue.field === 'customer.contact')

  return (
    <FieldGroup className="gap-6">
      <FieldSet>
        <FieldLegend>Cliente</FieldLegend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            {...shared}
            label="Nombre o razón social"
            field="customer.name"
            value={value.customer.name}
            onChange={(name) => setCustomer({ name })}
          />
          <TextField
            {...shared}
            label="NIF / CIF"
            value={value.customer.taxId}
            onChange={(taxId) => setCustomer({ taxId })}
          />
          <TextField
            {...shared}
            hideMessage
            label="Email"
            type="email"
            field="customer.contact"
            value={value.customer.email}
            onChange={(email) => setCustomer({ email })}
          />
          <TextField
            {...shared}
            hideMessage
            label="Teléfono"
            type="tel"
            field="customer.contact"
            value={value.customer.phone}
            onChange={(phone) => setCustomer({ phone })}
          />
        </div>
        {contactIssue.length > 0 ? <FieldError>{contactIssue[0]?.message}</FieldError> : null}
      </FieldSet>
      <FieldSet>
        <FieldLegend>Dirección de entrega</FieldLegend>
        <div className="grid gap-4 sm:grid-cols-6">
          <div className="sm:col-span-6">
            <TextField
              {...shared}
              label="Dirección"
              field="address.street"
              value={value.address.street}
              onChange={(street) => setAddress({ street })}
            />
          </div>
          <div className="sm:col-span-2">
            <TextField
              {...shared}
              label="Código postal"
              field="address.postalCode"
              value={value.address.postalCode}
              onChange={(postalCode) => setAddress({ postalCode })}
            />
          </div>
          <div className="sm:col-span-4">
            <TextField
              {...shared}
              label="Población"
              field="address.city"
              value={value.address.city}
              onChange={(city) => setAddress({ city })}
            />
          </div>
        </div>
      </FieldSet>
      <FieldSet>
        <FieldLegend>Artículos</FieldLegend>
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
