import { useRef } from 'react'
import ReactSignatureCanvas from 'react-signature-canvas'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/Modal'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (dataUrl: string) => void
  existingUrl?: string
}

export function SignatureModal({ open, onClose, onSave, existingUrl }: Props) {
  const { t } = useTranslation()
  const canvasRef = useRef<ReactSignatureCanvas>(null)

  function handleSave() {
    if (!canvasRef.current || canvasRef.current.isEmpty()) return
    const dataUrl = canvasRef.current.toDataURL('image/png')
    onSave(dataUrl)
  }

  return (
    <Modal open={open} onClose={onClose} title={t('payments.signMonth')} size="md">
      <div className="flex flex-col gap-4">
        {existingUrl ? (
          <div>
            <p className="text-sm text-gray-500 mb-2">{t('common.signedOn')}</p>
            <img src={existingUrl} alt="signature" className="border rounded-xl max-w-full" />
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600">{t('common.signatureRequired')}</p>
            <ReactSignatureCanvas
              ref={canvasRef}
              canvasProps={{
                className: 'signature-canvas w-full',
                style: { width: '100%', height: 180 },
              }}
              backgroundColor="rgba(250,250,250,1)"
            />
          </>
        )}
        <div className="flex gap-2">
          {!existingUrl && (
            <>
              <button
                className="btn-secondary flex-1"
                onClick={() => canvasRef.current?.clear()}
              >
                {t('common.clearSignature')}
              </button>
              <button className="btn-primary flex-1" onClick={handleSave}>
                {t('common.saveSignature')}
              </button>
            </>
          )}
          {existingUrl && (
            <button className="btn-secondary flex-1" onClick={onClose}>
              {t('common.close')}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
