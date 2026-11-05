import {
  Alert, AlertDescription, Button, Card, CardContent, CardFooter, CardHeader, CardTitle,
  PageHeader, PageHeaderActions, PageHeaderHeading, PageHeaderTitle, PageStack, SubmitButton, toast,
} from '@doscientos/ui'
import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useCatalog } from '@/features/catalog'
import { FormDialog } from '@/shared/ui/form-dialog'

import type { Order } from '../application/order'
import { emptyOrderDraft, mockExtractExample } from '../application/order-intake'
import { useOrders } from '../application/use-orders'
import { validateOrder } from '../application/validation'
import { OrderDataForm, type OrderFormValue } from './order-data-form'
import { OrderIntakeStep, type IntakeStep } from './order-intake-step'

interface NewOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  manual: boolean
  onManualChange: (manual: boolean) => void
  onCreated: (order: Order) => void
}

export function NewOrderDialog({ open, onOpenChange, manual, onManualChange, onCreated }: NewOrderDialogProps) {
  const { products } = useCatalog()
  const { receive, knownSkus } = useOrders()
  const [value, setValue] = useState<OrderFormValue>(emptyOrderDraft)
  const [step, setStep] = useState<IntakeStep>('choose')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [extracted, setExtracted] = useState<'text' | 'photo' | null>(null)
  const [attempted, setAttempted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [analysing, setAnalysing] = useState(false)
  const analysisTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (analysisTimer.current) clearTimeout(analysisTimer.current)
  }, [])

  const issues = attempted ? validateOrder(value, knownSkus) : []

  function close() {
    if (analysisTimer.current) clearTimeout(analysisTimer.current)
    analysisTimer.current = null
    setAnalysing(false)
    setValue(emptyOrderDraft())
    setStep('choose')
    setText('')
    setFile(null)
    setExtracted(null)
    setAttempted(false)
    onManualChange(false)
    onOpenChange(false)
  }

  function analyse(kind: 'text' | 'photo', originalText?: string) {
    if (analysing) return
    setAnalysing(true)
    analysisTimer.current = setTimeout(() => {
      setValue(mockExtractExample(products, originalText))
      setExtracted(kind)
      setStep('review')
      setAnalysing(false)
      analysisTimer.current = null
    }, 1200)
  }

  async function submit() {
    setAttempted(true)
    setSaving(true)
    try {
      const order = await receive({
        ...value,
        channel: 'manual',
        whatsappPhoto: null,
        notes: '',
      })
      toast.success('Pedido creado', { description: order.reference })
      close()
      onCreated(order)
    } finally {
      setSaving(false)
    }
  }

  if (manual) {
    return (
      <PageStack>
        <PageHeader>
          <PageHeaderHeading>
            <PageHeaderTitle>Nuevo pedido</PageHeaderTitle>
          </PageHeaderHeading>
          <PageHeaderActions>
            <Button variant="outline" isDisabled={saving} onPress={() => {
              onManualChange(false)
              setStep('choose')
            }}>
              <ArrowLeft aria-hidden /> Cambiar origen
            </Button>
          </PageHeaderActions>
        </PageHeader>
        <form onSubmit={(event) => { event.preventDefault(); if (!saving) void submit() }}>
          <Card>
            <CardHeader><CardTitle>Datos del pedido</CardTitle></CardHeader>
            <CardContent>
              <OrderDataForm value={value} issues={issues} products={products} disabled={saving} onChange={setValue} />
            </CardContent>
            <CardFooter className="flex flex-wrap justify-end gap-3">
              <Button variant="outline" isDisabled={saving} onPress={close}>Cancelar</Button>
              <SubmitButton loading={saving}>Registrar pedido</SubmitButton>
            </CardFooter>
          </Card>
        </form>
      </PageStack>
    )
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title="Nuevo pedido"
      description={step === 'choose' ? 'Elige cómo quieres introducir el pedido.' : 'Revisa los datos antes de registrar el pedido.'}
      submitLabel={step === 'review' ? 'Registrar pedido' : 'Analizar texto'}
      showSubmit={step === 'review' || step === 'text'}
      submitDisabled={(step === 'text' && !text.trim()) || (step === 'photo' && !file?.type.startsWith('image/'))}
      size="xl"
      loading={saving || analysing}
      onSubmit={() => (step === 'review' ? void submit() : analyse('text', text))}
    >
      {analysing ? (
        <output className="grid justify-items-center gap-3 py-10 text-center">
          <LoaderCircle aria-hidden className="text-primary size-7 animate-spin motion-reduce:animate-none" />
          <span className="font-medium">Analizando {step === 'photo' ? 'la imagen' : 'el texto'}…</span>
          <span className="text-muted-foreground text-sm">Preparando los datos del pedido.</span>
        </output>
      ) : step === 'review' ? (
        <>
          <Button variant="ghost" size="sm" className="w-fit" onPress={() => setStep('choose')}>
            <ArrowLeft aria-hidden /> Cambiar origen
          </Button>
          {extracted ? (
            <Alert variant="info">
              <AlertDescription>
                Datos de ejemplo: {extracted === 'photo' ? 'la imagen' : 'el texto'} no se ha analizado.
              </AlertDescription>
            </Alert>
          ) : null}
          <OrderDataForm value={value} issues={issues} products={products} onChange={setValue} />
        </>
      ) : (
        <OrderIntakeStep
          step={step}
          text={text}
          file={file}
          onStepChange={(next) => {
            if (next === 'review') {
              setValue(emptyOrderDraft())
              setExtracted(null)
              setAttempted(false)
              onManualChange(true)
            }
            setStep(next)
          }}
          onTextChange={setText}
          onFileChange={(next) => {
            setFile(next)
            if (next?.type.startsWith('image/')) analyse('photo')
          }}
        />
      )}
    </FormDialog>
  )
}
