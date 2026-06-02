import React from 'react'
import { SmsCredit } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MessageSquare, AlertTriangle, Plus } from 'lucide-react'

interface SmsCreditWidgetProps {
  credits: SmsCredit
  onPurchase: (amount: number) => void
}

export function SmsCreditWidget({ credits, onPurchase }: SmsCreditWidgetProps) {
  const isLow = credits.remaining_credits <= credits.alert_threshold

  return (
    <Card className={isLow ? 'border-warning' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isLow ? 'bg-amber-100' : 'bg-green-100'}`}>
              <MessageSquare className={`w-5 h-5 ${isLow ? 'text-amber-600' : 'text-green-600'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Crédits SMS</h3>
              <p className="text-xs text-gray-500">{credits.provider}</p>
            </div>
          </div>
          {isLow && (
            <Badge variant="warning">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Stock bas
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total acheté:</span>
            <span className="font-medium">{credits.total_credits.toLocaleString('fr-FR')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Utilisé:</span>
            <span className="font-medium text-danger">{credits.used_credits.toLocaleString('fr-FR')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Restant:</span>
            <span className={`font-bold ${isLow ? 'text-warning' : 'text-success'}`}>
              {credits.remaining_credits.toLocaleString('fr-FR')}
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                isLow ? 'bg-warning' : 'bg-success'
              }`}
              style={{ width: `${(credits.remaining_credits / credits.total_credits) * 100}%` }}
            />
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4"
          onClick={() => onPurchase(1000)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Acheter des crédits
        </Button>
      </CardContent>
    </Card>
  )
}
