# Email Service

## Overview

Enterprise-grade email service supporting multiple providers (SendGrid, AWS SES, Mailgun), templates, transactional emails, and comprehensive tracking.

## Priority

**HIGH** - Critical for user communications, notifications, and transactional emails

## Dependencies

- `apollo-server` (for email GraphQL resolvers)
- `prisma` (for email tracking and templates)

## Feature Description

Complete email infrastructure with provider flexibility, template management, queue processing, delivery tracking, and analytics for reliable email communications.

### Key Features

- **Multi-Provider Support**: SendGrid, AWS SES, Mailgun, SMTP
- **Template Engine**: Handlebars-based email templates with variables
- **Queue Processing**: Background job processing for reliable delivery
- **Delivery Tracking**: Open rates, click tracking, bounce handling
- **Email Categories**: Transactional, marketing, notifications
- **A/B Testing**: Template variants for optimization
- **Compliance**: Unsubscribe management, GDPR compliance

## Configuration

```typescript
interface EmailConfig {
  provider: 'sendgrid' | 'ses' | 'mailgun' | 'smtp'
  providers: {
    sendgrid?: {
      apiKey: string
      fromEmail: string
      fromName: string
      trackingEnabled: boolean
    }
    ses?: {
      region: string
      accessKeyId: string
      secretAccessKey: string
      fromEmail: string
      fromName: string
    }
    mailgun?: {
      apiKey: string
      domain: string
      fromEmail: string
      fromName: string
    }
    smtp?: {
      host: string
      port: number
      secure: boolean
      auth: {
        user: string
        pass: string
      }
      fromEmail: string
      fromName: string
    }
  }
  templates: {
    directory: string
    cacheEnabled: boolean
    defaultVariables: Record<string, any>
  }
  queue: {
    enabled: boolean
    maxAttempts: number
    delayBetweenAttempts: number
    processInterval: number
  }
  tracking: {
    opens: boolean
    clicks: boolean
    unsubscribes: boolean
    bounces: boolean
  }
  compliance: {
    unsubscribeLink: boolean
    gdprCompliant: boolean
    requireConsent: boolean
  }
}
```

## Generated Files

### Backend Implementation

```
api/src/
├── email/
│   ├── index.ts                  # Email exports
│   ├── providers/
│   │   ├── sendgrid.ts           # SendGrid provider
│   │   ├── ses.ts                # AWS SES provider
│   │   ├── mailgun.ts            # Mailgun provider
│   │   └── smtp.ts               # SMTP provider
│   ├── services/
│   │   ├── emailService.ts       # Main email service
│   │   ├── templateService.ts    # Template management
│   │   ├── queueService.ts       # Email queue processing
│   │   ├── trackingService.ts    # Email tracking
│   │   └── unsubscribeService.ts # Unsubscribe management
│   ├── resolvers/
│   │   ├── emailResolvers.ts     # GraphQL email resolvers
│   │   └── templateResolvers.ts  # Template management resolvers
│   ├── middleware/
│   │   ├── trackingMiddleware.ts # Email tracking middleware
│   │   └── webhookMiddleware.ts  # Provider webhook handling
│   ├── jobs/
│   │   ├── emailQueue.ts         # Email queue jobs
│   │   └── processEmails.ts      # Email processing job
│   ├── templates/
│   │   ├── welcome.hbs           # Welcome email template
│   │   ├── reset-password.hbs    # Password reset template
│   │   ├── notification.hbs      # Generic notification template
│   │   └── layouts/
│   │       └── base.hbs          # Base email layout
│   └── types.ts                  # Email type definitions
```

### Frontend Implementation

```
web/src/
├── email/
│   ├── index.ts                  # Email exports
│   ├── components/
│   │   ├── EmailEditor.tsx       # Email template editor
│   │   ├── EmailPreview.tsx      # Email preview component
│   │   ├── EmailStats.tsx        # Email analytics
│   │   ├── UnsubscribePage.tsx   # Unsubscribe page
│   │   └── EmailCampaigns.tsx    # Campaign management
│   ├── hooks/
│   │   ├── useEmailService.ts    # Email service hook
│   │   ├── useEmailTemplates.ts  # Template management hook
│   │   └── useEmailAnalytics.ts  # Analytics hook
│   ├── services/
│   │   ├── emailApi.ts           # Email API service
│   │   └── templateApi.ts        # Template API service
│   └── utils/
│       ├── emailValidation.ts    # Email validation utilities
│       └── templateUtils.ts      # Template utilities
```

## Code Examples

### Email Service (Backend)

```typescript
// api/src/email/services/emailService.ts
import { SendGridProvider } from '../providers/sendgrid'
import { SESProvider } from '../providers/ses'
import { MailgunProvider } from '../providers/mailgun'
import { TemplateService } from './templateService'
import { QueueService } from './queueService'
import { TrackingService } from './trackingService'

export class EmailService {
  private provider: any
  private templateService: TemplateService
  private queueService: QueueService
  private trackingService: TrackingService

  constructor(private config: EmailConfig) {
    this.templateService = new TemplateService(config.templates)
    this.queueService = new QueueService(config.queue)
    this.trackingService = new TrackingService(config.tracking)
    this.initializeProvider()
  }

  private initializeProvider() {
    switch (this.config.provider) {
      case 'sendgrid':
        this.provider = new SendGridProvider(this.config.providers.sendgrid!)
        break
      case 'ses':
        this.provider = new SESProvider(this.config.providers.ses!)
        break
      case 'mailgun':
        this.provider = new MailgunProvider(this.config.providers.mailgun!)
        break
      default:
        throw new Error(`Unsupported email provider: ${this.config.provider}`)
    }
  }

  async sendEmail(emailData: SendEmailData): Promise<EmailResult> {
    const email = await this.prepareEmail(emailData)

    if (this.config.queue.enabled) {
      // Queue the email for background processing
      const jobId = await this.queueService.addToQueue(email)
      return {
        id: jobId,
        status: 'queued',
        message: 'Email queued for delivery',
      }
    } else {
      // Send immediately
      return this.sendImmediately(email)
    }
  }

  async sendTemplate(templateData: SendTemplateData): Promise<EmailResult> {
    const renderedContent = await this.templateService.render(templateData.template, templateData.variables)

    return this.sendEmail({
      ...templateData,
      subject: renderedContent.subject,
      html: renderedContent.html,
      text: renderedContent.text,
    })
  }

  async sendBulk(bulkData: SendBulkData): Promise<EmailResult[]> {
    const emails = await Promise.all(
      bulkData.recipients.map(async recipient => {
        if (bulkData.template) {
          const variables = { ...bulkData.variables, ...recipient.variables }
          const renderedContent = await this.templateService.render(bulkData.template, variables)

          return {
            to: recipient.email,
            subject: renderedContent.subject,
            html: renderedContent.html,
            text: renderedContent.text,
            variables,
          }
        }

        return {
          to: recipient.email,
          subject: bulkData.subject,
          html: bulkData.html,
          text: bulkData.text,
        }
      }),
    )

    if (this.config.queue.enabled) {
      const jobIds = await Promise.all(emails.map(email => this.queueService.addToQueue(email)))
      return jobIds.map(id => ({
        id,
        status: 'queued',
        message: 'Email queued for delivery',
      }))
    } else {
      return Promise.all(emails.map(email => this.sendImmediately(email)))
    }
  }

  private async prepareEmail(emailData: SendEmailData): Promise<PreparedEmail> {
    const trackingId =
      this.config.tracking.opens || this.config.tracking.clicks
        ? await this.trackingService.createTracking({
            to: emailData.to,
            subject: emailData.subject,
            category: emailData.category,
          })
        : undefined

    let html = emailData.html
    let text = emailData.text

    // Add tracking pixels and links
    if (trackingId && this.config.tracking.opens && html) {
      html = this.trackingService.addOpenTracking(html, trackingId)
    }

    if (trackingId && this.config.tracking.clicks && html) {
      html = this.trackingService.addClickTracking(html, trackingId)
    }

    // Add unsubscribe link if required
    if (this.config.compliance.unsubscribeLink) {
      const unsubscribeUrl = await this.generateUnsubscribeUrl(emailData.to)
      html = this.addUnsubscribeLink(html, unsubscribeUrl)
    }

    return {
      ...emailData,
      html,
      text,
      trackingId,
    }
  }

  private async sendImmediately(email: PreparedEmail): Promise<EmailResult> {
    try {
      const result = await this.provider.send(email)

      // Update tracking
      if (email.trackingId) {
        await this.trackingService.updateStatus(email.trackingId, 'sent', {
          providerId: result.id,
          sentAt: new Date(),
        })
      }

      return {
        id: result.id,
        status: 'sent',
        message: 'Email sent successfully',
      }
    } catch (error) {
      // Update tracking
      if (email.trackingId) {
        await this.trackingService.updateStatus(email.trackingId, 'failed', {
          error: error.message,
          failedAt: new Date(),
        })
      }

      throw new Error(`Email delivery failed: ${error.message}`)
    }
  }

  async getEmailStatus(emailId: string): Promise<EmailStatus> {
    return this.trackingService.getStatus(emailId)
  }

  async getEmailAnalytics(filters: AnalyticsFilters): Promise<EmailAnalytics> {
    return this.trackingService.getAnalytics(filters)
  }

  async unsubscribe(token: string): Promise<boolean> {
    return this.unsubscribeService.processUnsubscribe(token)
  }

  private async generateUnsubscribeUrl(email: string): Promise<string> {
    const token = await this.unsubscribeService.generateToken(email)
    return `${process.env.WEB_URL}/unsubscribe?token=${token}`
  }

  private addUnsubscribeLink(html: string, unsubscribeUrl: string): string {
    const unsubscribeHtml = `
      <div style="text-align: center; margin: 20px 0; font-size: 12px; color: #666;">
        <a href="${unsubscribeUrl}" style="color: #666; text-decoration: underline;">
          Unsubscribe from these emails
        </a>
      </div>
    `

    return html.replace('</body>', `${unsubscribeHtml}</body>`)
  }
}

interface SendEmailData {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  attachments?: EmailAttachment[]
  category?: string
  tags?: string[]
}

interface SendTemplateData {
  to: string | string[]
  template: string
  variables: Record<string, any>
  category?: string
  tags?: string[]
}

interface SendBulkData {
  recipients: Array<{
    email: string
    variables?: Record<string, any>
  }>
  template?: string
  subject?: string
  html?: string
  text?: string
  variables?: Record<string, any>
  category?: string
}

interface EmailResult {
  id: string
  status: 'sent' | 'queued' | 'failed'
  message: string
}

interface PreparedEmail extends SendEmailData {
  trackingId?: string
}

interface EmailAttachment {
  filename: string
  content: Buffer
  contentType?: string
}
```

### SendGrid Provider Implementation

```typescript
// api/src/email/providers/sendgrid.ts
import sgMail from '@sendgrid/mail'

export class SendGridProvider {
  constructor(private config: SendGridConfig) {
    sgMail.setApiKey(config.apiKey)
  }

  async send(email: EmailData): Promise<ProviderResult> {
    const msg: sgMail.MailDataRequired = {
      to: Array.isArray(email.to) ? email.to : [email.to],
      from: {
        email: this.config.fromEmail,
        name: this.config.fromName,
      },
      subject: email.subject,
      html: email.html,
      text: email.text,
      attachments: email.attachments?.map(att => ({
        filename: att.filename,
        content: att.content.toString('base64'),
        type: att.contentType,
        disposition: 'attachment',
      })),
      trackingSettings: {
        clickTracking: {
          enable: this.config.trackingEnabled,
        },
        openTracking: {
          enable: this.config.trackingEnabled,
        },
      },
    }

    if (email.category) {
      msg.categories = [email.category]
    }

    if (email.tags) {
      msg.customArgs = email.tags.reduce(
        (acc, tag) => {
          acc[tag] = 'true'
          return acc
        },
        {} as Record<string, string>,
      )
    }

    try {
      const [response] = await sgMail.send(msg)

      return {
        id: response.headers['x-message-id'] || Date.now().toString(),
        status: 'sent',
        providerId: response.headers['x-message-id'],
      }
    } catch (error) {
      throw new Error(`SendGrid error: ${error.message}`)
    }
  }

  async sendBatch(emails: EmailData[]): Promise<ProviderResult[]> {
    const messages = emails.map(email => ({
      to: Array.isArray(email.to) ? email.to : [email.to],
      from: {
        email: this.config.fromEmail,
        name: this.config.fromName,
      },
      subject: email.subject,
      html: email.html,
      text: email.text,
    }))

    try {
      const responses = await sgMail.send(messages)

      return responses.map((response, index) => ({
        id: response.headers['x-message-id'] || `batch-${Date.now()}-${index}`,
        status: 'sent',
        providerId: response.headers['x-message-id'],
      }))
    } catch (error) {
      throw new Error(`SendGrid batch error: ${error.message}`)
    }
  }

  async handleWebhook(event: any): Promise<void> {
    // Handle SendGrid webhook events (opens, clicks, bounces, etc.)
    switch (event.event) {
      case 'delivered':
        await this.handleDelivered(event)
        break
      case 'open':
        await this.handleOpen(event)
        break
      case 'click':
        await this.handleClick(event)
        break
      case 'bounce':
        await this.handleBounce(event)
        break
      case 'unsubscribe':
        await this.handleUnsubscribe(event)
        break
    }
  }

  private async handleDelivered(event: any) {
    // Update email tracking status
  }

  private async handleOpen(event: any) {
    // Track email opens
  }

  private async handleClick(event: any) {
    // Track link clicks
  }

  private async handleBounce(event: any) {
    // Handle email bounces
  }

  private async handleUnsubscribe(event: any) {
    // Handle unsubscribes
  }
}

interface SendGridConfig {
  apiKey: string
  fromEmail: string
  fromName: string
  trackingEnabled: boolean
}

interface EmailData {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  attachments?: EmailAttachment[]
  category?: string
  tags?: string[]
}

interface ProviderResult {
  id: string
  status: string
  providerId?: string
}
```

### Template Service

```typescript
// api/src/email/services/templateService.ts
import Handlebars from 'handlebars'
import fs from 'fs/promises'
import path from 'path'

export class TemplateService {
  private cache = new Map<string, HandlebarsTemplateDelegate>()
  private layoutCache = new Map<string, HandlebarsTemplateDelegate>()

  constructor(private config: TemplateConfig) {
    this.registerHelpers()
  }

  async render(templateName: string, variables: Record<string, any> = {}): Promise<RenderedTemplate> {
    const template = await this.getTemplate(templateName)
    const layout = await this.getLayout('base')

    const mergedVariables = {
      ...this.config.defaultVariables,
      ...variables,
    }

    const content = template(mergedVariables)
    const html = layout({
      ...mergedVariables,
      content,
    })

    // Also render text version if available
    let text: string | undefined
    try {
      const textTemplate = await this.getTemplate(`${templateName}.text`)
      text = textTemplate(mergedVariables)
    } catch {
      // Text template doesn't exist, generate from HTML
      text = this.htmlToText(html)
    }

    // Extract subject from template if available
    const subjectMatch = html.match(/<title>(.*?)<\/title>/i)
    const subject = subjectMatch ? subjectMatch[1] : `${templateName} notification`

    return {
      subject,
      html,
      text,
    }
  }

  async renderInline(template: string, variables: Record<string, any> = {}): Promise<string> {
    const compiledTemplate = Handlebars.compile(template)
    return compiledTemplate({
      ...this.config.defaultVariables,
      ...variables,
    })
  }

  private async getTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
    if (this.config.cacheEnabled && this.cache.has(templateName)) {
      return this.cache.get(templateName)!
    }

    const templatePath = path.join(this.config.directory, `${templateName}.hbs`)
    const templateContent = await fs.readFile(templatePath, 'utf-8')
    const compiled = Handlebars.compile(templateContent)

    if (this.config.cacheEnabled) {
      this.cache.set(templateName, compiled)
    }

    return compiled
  }

  private async getLayout(layoutName: string): Promise<HandlebarsTemplateDelegate> {
    if (this.config.cacheEnabled && this.layoutCache.has(layoutName)) {
      return this.layoutCache.get(layoutName)!
    }

    const layoutPath = path.join(this.config.directory, 'layouts', `${layoutName}.hbs`)
    const layoutContent = await fs.readFile(layoutPath, 'utf-8')
    const compiled = Handlebars.compile(layoutContent)

    if (this.config.cacheEnabled) {
      this.layoutCache.set(layoutName, compiled)
    }

    return compiled
  }

  private registerHelpers() {
    Handlebars.registerHelper('formatDate', (date: Date, format: string) => {
      // Simple date formatting - in production, use a proper date library
      return date.toLocaleDateString()
    })

    Handlebars.registerHelper('formatCurrency', (amount: number, currency = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(amount)
    })

    Handlebars.registerHelper('eq', (a: any, b: any) => a === b)
    Handlebars.registerHelper('ne', (a: any, b: any) => a !== b)
    Handlebars.registerHelper('gt', (a: number, b: number) => a > b)
    Handlebars.registerHelper('lt', (a: number, b: number) => a < b)

    Handlebars.registerHelper('json', (obj: any) => JSON.stringify(obj, null, 2))
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    // In production, use a proper library like html-to-text
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim()
  }

  clearCache() {
    this.cache.clear()
    this.layoutCache.clear()
  }
}

interface TemplateConfig {
  directory: string
  cacheEnabled: boolean
  defaultVariables: Record<string, any>
}

interface RenderedTemplate {
  subject: string
  html: string
  text?: string
}
```

### React Email Management Component

```typescript
// web/src/email/components/EmailCampaigns.tsx
import React, { useState, useEffect } from 'react'
import { useEmailService } from '../hooks/useEmailService'
import { useEmailAnalytics } from '../hooks/useEmailAnalytics'

export const EmailCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null)
  const { sendBulkEmail, getEmailTemplates } = useEmailService()
  const { getAnalytics } = useEmailAnalytics()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null)

  useEffect(() => {
    loadCampaigns()
    loadTemplates()
  }, [])

  useEffect(() => {
    if (selectedCampaign) {
      loadAnalytics(selectedCampaign)
    }
  }, [selectedCampaign])

  const loadCampaigns = async () => {
    // Load campaigns from API
  }

  const loadTemplates = async () => {
    const templateData = await getEmailTemplates()
    setTemplates(templateData)
  }

  const loadAnalytics = async (campaignId: string) => {
    const analyticsData = await getAnalytics({ campaignId })
    setAnalytics(analyticsData)
  }

  const createCampaign = async (campaignData: CreateCampaignData) => {
    try {
      const result = await sendBulkEmail({
        recipients: campaignData.recipients,
        template: campaignData.template,
        variables: campaignData.variables,
        category: 'campaign',
      })

      // Refresh campaigns list
      loadCampaigns()
    } catch (error) {
      console.error('Failed to create campaign:', error)
    }
  }

  return (
    <div className="email-campaigns">
      <div className="campaigns-header">
        <h1>Email Campaigns</h1>
        <button
          className="create-campaign-btn"
          onClick={() => {/* Open create campaign modal */}}
        >
          Create Campaign
        </button>
      </div>

      <div className="campaigns-content">
        <div className="campaigns-list">
          <h2>Campaigns</h2>
          {campaigns.map(campaign => (
            <div
              key={campaign.id}
              className={`campaign-item ${selectedCampaign === campaign.id ? 'active' : ''}`}
              onClick={() => setSelectedCampaign(campaign.id)}
            >
              <h3>{campaign.name}</h3>
              <p>{campaign.subject}</p>
              <div className="campaign-stats">
                <span>Sent: {campaign.stats.sent}</span>
                <span>Opens: {campaign.stats.opens}</span>
                <span>Clicks: {campaign.stats.clicks}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="campaign-details">
          {selectedCampaign && analytics && (
            <div className="analytics-panel">
              <h2>Campaign Analytics</h2>

              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Delivery Rate</h3>
                  <p className="stat-value">{analytics.deliveryRate}%</p>
                </div>

                <div className="stat-card">
                  <h3>Open Rate</h3>
                  <p className="stat-value">{analytics.openRate}%</p>
                </div>

                <div className="stat-card">
                  <h3>Click Rate</h3>
                  <p className="stat-value">{analytics.clickRate}%</p>
                </div>

                <div className="stat-card">
                  <h3>Unsubscribe Rate</h3>
                  <p className="stat-value">{analytics.unsubscribeRate}%</p>
                </div>
              </div>

              <div className="timeline-chart">
                {/* Email engagement timeline chart */}
              </div>

              <div className="top-links">
                <h3>Top Clicked Links</h3>
                {analytics.topLinks.map((link, index) => (
                  <div key={index} className="link-stat">
                    <span className="link-url">{link.url}</span>
                    <span className="link-clicks">{link.clicks} clicks</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface EmailCampaign {
  id: string
  name: string
  subject: string
  template: string
  status: 'draft' | 'sending' | 'sent' | 'paused'
  stats: {
    sent: number
    delivered: number
    opens: number
    clicks: number
    unsubscribes: number
  }
  createdAt: Date
  sentAt?: Date
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  category: string
  variables: string[]
}

interface CampaignAnalytics {
  deliveryRate: number
  openRate: number
  clickRate: number
  unsubscribeRate: number
  topLinks: Array<{
    url: string
    clicks: number
  }>
  timeline: Array<{
    date: string
    opens: number
    clicks: number
  }>
}

interface CreateCampaignData {
  name: string
  template: string
  recipients: Array<{
    email: string
    variables?: Record<string, any>
  }>
  variables: Record<string, any>
}
```

### Email GraphQL Resolvers

```typescript
// api/src/email/resolvers/emailResolvers.ts
import { EmailService } from '../services/emailService'
import { requireAuth } from '../../auth/middleware'

const emailService = new EmailService()

export const emailResolvers = {
  Mutation: {
    sendEmail: requireAuth(async (parent: any, { input }: { input: SendEmailInput }, context: any) => {
      const result = await emailService.sendEmail({
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        category: input.category,
        tags: input.tags,
      })

      return {
        id: result.id,
        status: result.status,
        message: result.message,
      }
    }),

    sendTemplateEmail: requireAuth(async (parent: any, { input }: { input: SendTemplateEmailInput }, context: any) => {
      const result = await emailService.sendTemplate({
        to: input.to,
        template: input.template,
        variables: input.variables,
        category: input.category,
      })

      return {
        id: result.id,
        status: result.status,
        message: result.message,
      }
    }),

    sendBulkEmail: requireAuth(async (parent: any, { input }: { input: SendBulkEmailInput }, context: any) => {
      const results = await emailService.sendBulk({
        recipients: input.recipients,
        template: input.template,
        subject: input.subject,
        html: input.html,
        variables: input.variables,
        category: input.category,
      })

      return {
        results: results.map(r => ({
          id: r.id,
          status: r.status,
          message: r.message,
        })),
        totalSent: results.length,
      }
    }),
  },

  Query: {
    emailStatus: requireAuth(async (parent: any, { emailId }: { emailId: string }, context: any) => {
      return emailService.getEmailStatus(emailId)
    }),

    emailAnalytics: requireAuth(async (parent: any, { filters }: { filters: AnalyticsFilters }, context: any) => {
      return emailService.getEmailAnalytics(filters)
    }),

    emailTemplates: requireAuth(async (parent: any, args: any, context: any) => {
      // Return available email templates
      return []
    }),
  },
}

interface SendEmailInput {
  to: string[]
  subject: string
  html?: string
  text?: string
  category?: string
  tags?: string[]
}

interface SendTemplateEmailInput {
  to: string[]
  template: string
  variables: Record<string, any>
  category?: string
}

interface SendBulkEmailInput {
  recipients: Array<{
    email: string
    variables?: Record<string, any>
  }>
  template?: string
  subject?: string
  html?: string
  variables?: Record<string, any>
  category?: string
}

interface AnalyticsFilters {
  dateFrom?: string
  dateTo?: string
  category?: string
  campaign?: string
}
```

## Database Schema

```prisma
// Add to schema.prisma
model Email {
  id            String        @id @default(cuid())
  to            String[]      // Array of recipient emails
  from          String
  subject       String
  html          String?       @db.Text
  text          String?       @db.Text
  template      String?
  variables     Json?
  category      String?
  tags          String[]
  status        EmailStatus
  providerId    String?       // Provider's message ID
  trackingId    String?       @unique
  sentAt        DateTime?
  deliveredAt   DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  tracking      EmailTracking?
  opens         EmailOpen[]
  clicks        EmailClick[]

  @@map("emails")
}

model EmailTracking {
  id          String   @id @default(cuid())
  emailId     String   @unique
  opens       Int      @default(0)
  clicks      Int      @default(0)
  delivered   Boolean  @default(false)
  bounced     Boolean  @default(false)
  unsubscribed Boolean @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  email       Email    @relation(fields: [emailId], references: [id], onDelete: Cascade)

  @@map("email_tracking")
}

model EmailOpen {
  id        String   @id @default(cuid())
  emailId   String
  ipAddress String?
  userAgent String?  @db.Text
  openedAt  DateTime @default(now())

  email     Email    @relation(fields: [emailId], references: [id], onDelete: Cascade)

  @@map("email_opens")
}

model EmailClick {
  id        String   @id @default(cuid())
  emailId   String
  url       String   @db.Text
  ipAddress String?
  userAgent String?  @db.Text
  clickedAt DateTime @default(now())

  email     Email    @relation(fields: [emailId], references: [id], onDelete: Cascade)

  @@map("email_clicks")
}

model EmailTemplate {
  id          String   @id @default(cuid())
  name        String   @unique
  subject     String
  html        String   @db.Text
  text        String?  @db.Text
  variables   String[] // Available template variables
  category    String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("email_templates")
}

model UnsubscribeToken {
  id        String   @id @default(cuid())
  email     String
  token     String   @unique
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  expiresAt DateTime

  @@map("unsubscribe_tokens")
}

enum EmailStatus {
  QUEUED
  SENDING
  SENT
  DELIVERED
  FAILED
  BOUNCED
}
```

## Installation Steps

1. **Install Email Dependencies**

   ```bash
   # Backend
   pnpm add @sendgrid/mail aws-sdk mailgun.js nodemailer handlebars bull
   pnpm add -D @types/nodemailer

   # Frontend
   pnpm add react-quill chart.js react-chartjs-2
   ```

2. **Configure Environment Variables**

   ```env
   # Email Provider (choose one or configure multiple)
   EMAIL_PROVIDER=sendgrid

   # SendGrid
   SENDGRID_API_KEY=your-sendgrid-api-key
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   SENDGRID_FROM_NAME=Your App Name

   # AWS SES
   AWS_SES_REGION=us-east-1
   AWS_SES_ACCESS_KEY_ID=your-access-key
   AWS_SES_SECRET_ACCESS_KEY=your-secret-key

   # Mailgun
   MAILGUN_API_KEY=your-mailgun-api-key
   MAILGUN_DOMAIN=your-mailgun-domain

   # Email Configuration
   EMAIL_QUEUE_ENABLED=true
   EMAIL_TRACKING_ENABLED=true
   WEB_URL=https://yourdomain.com
   ```

3. **Database Migration**

   ```bash
   pnpm prisma migrate dev --name add-email-system
   ```

4. **Create Email Templates Directory**
   ```bash
   mkdir -p api/src/email/templates/layouts
   ```

This email service provides enterprise-grade email capabilities with multi-provider support, advanced tracking, template management, and comprehensive analytics.
