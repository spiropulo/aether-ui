import { gql } from '@apollo/client/core'

// ─── Projects ────────────────────────────────────────────────────────────────

/** Canonical workflow statuses (must match aether-app ProjectGraphqlController.SUGGESTED_STATUSES). */
export const PROJECT_STATUS_OPTIONS = [
  'Not Started',
  'In Progress',
  'On Hold',
  'Completed',
  'Cancelled',
]

export const GET_SUGGESTED_PROJECT_STATUSES = gql`
  query GetSuggestedProjectStatuses {
    suggestedProjectStatuses
  }
`

export const GET_PROJECTS = gql`
  query GetProjects($tenantId: String!, $page: PageInput) {
    projects(tenantId: $tenantId, page: $page) {
      items {
        id
        name
        description
        status
        startDate
        endDate
        total
        addressLine1
        addressLine2
        city
        state
        postalCode
        country
        createdAt
        updatedAt
      }
      total
      hasNext
      limit
      offset
    }
  }
`

export const GET_PROJECT = gql`
  query GetProject($id: ID!, $tenantId: String!) {
    project(id: $id, tenantId: $tenantId) {
      id
      name
      description
      status
      startDate
      endDate
      tenantId
      sourcePdfUploadId
      addressLine1
      addressLine2
      city
      state
      postalCode
      country
      createdAt
      updatedAt
      laborRateOverrides {
        userProfileId
        hourlyRate
      }
      laborWorkdayStart
      laborWorkdayEnd
    }
  }
`

export const GET_PROJECT_STATUS = gql`
  query GetProjectStatus($id: ID!, $tenantId: String!) {
    project(id: $id, tenantId: $tenantId) {
      id
      status
      sourcePdfUploadId
    }
  }
`

export const CREATE_PROJECT = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      name
      description
      status
      startDate
      endDate
      tenantId
      addressLine1
      addressLine2
      city
      state
      postalCode
      country
      createdAt
    }
  }
`

export const UPDATE_PROJECT = gql`
  mutation UpdateProject($id: ID!, $tenantId: String!, $input: UpdateProjectInput!) {
    updateProject(id: $id, tenantId: $tenantId, input: $input) {
      id
      name
      description
      status
      startDate
      endDate
      addressLine1
      addressLine2
      city
      state
      postalCode
      country
      updatedAt
      laborRateOverrides {
        userProfileId
        hourlyRate
      }
      laborWorkdayStart
      laborWorkdayEnd
    }
  }
`

export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: ID!, $tenantId: String!) {
    deleteProject(id: $id, tenantId: $tenantId)
  }
`

// ─── Tasks ───────────────────────────────────────────────────────────────────

export const GET_TASKS = gql`
  query GetTasks($projectId: String!, $tenantId: String!, $page: PageInput) {
    tasks(projectId: $projectId, tenantId: $tenantId, page: $page) {
      items {
        id
        name
        description
        assigneeIds
        startDate
        endDate
        calendarColor
        calendarExcludedDates
        projectId
        tenantId
        offerCompletionPercent
        createdAt
        updatedAt
      }
      total
      hasNext
      limit
      offset
    }
  }
`

export const GET_TASK = gql`
  query GetTask($id: ID!, $projectId: String!, $tenantId: String!) {
    task(id: $id, projectId: $projectId, tenantId: $tenantId) {
      id
      name
      description
      assigneeIds
      startDate
      endDate
      calendarColor
      calendarExcludedDates
      projectId
      tenantId
      offerCompletionPercent
      createdAt
      updatedAt
    }
  }
`

export const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
      name
      description
      assigneeIds
      startDate
      endDate
      calendarColor
      calendarExcludedDates
      projectId
      tenantId
      createdAt
    }
  }
`

export const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $projectId: String!, $tenantId: String!, $input: UpdateTaskInput!) {
    updateTask(id: $id, projectId: $projectId, tenantId: $tenantId, input: $input) {
      id
      name
      description
      assigneeIds
      startDate
      endDate
      calendarColor
      calendarExcludedDates
      updatedAt
    }
  }
`

export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!, $projectId: String!, $tenantId: String!) {
    deleteTask(id: $id, projectId: $projectId, tenantId: $tenantId)
  }
`

// ─── Project totals (offers by project) ──────────────────────────────────────

export const GET_OFFERS_BY_PROJECT = gql`
  query GetOffersByProject($tenantId: String!, $projectId: String!) {
    offersByProject(tenantId: $tenantId, projectId: $projectId) {
      id
      taskId
      quantity
      unitCost
      total
      assigneeIds
      workCompleted
      workCompletedAt
    }
  }
`

// ─── Offers ──────────────────────────────────────────────────────────────────

export const GET_OFFERS = gql`
  query GetOffers($projectId: String!, $taskId: String!, $tenantId: String!, $page: PageInput) {
    offers(projectId: $projectId, taskId: $taskId, tenantId: $tenantId, page: $page) {
      items {
        id
        name
        description
        uom
        quantity
        unitCost
        duration
        total
        assigneeIds
        workCompleted
        workCompletedAt
        projectId
        taskId
        tenantId
        createdAt
        updatedAt
      }
      total
      hasNext
      limit
      offset
    }
  }
`

export const GET_OFFER = gql`
  query GetOffer($id: ID!, $projectId: String!, $taskId: String!, $tenantId: String!) {
    offer(id: $id, projectId: $projectId, taskId: $taskId, tenantId: $tenantId) {
      id
      name
      description
      uom
      quantity
      unitCost
      duration
      total
      assigneeIds
      workCompleted
      workCompletedAt
      projectId
      taskId
      tenantId
      createdAt
      updatedAt
    }
  }
`

export const CREATE_OFFER = gql`
  mutation CreateOffer($input: CreateOfferInput!) {
    createOffer(input: $input) {
      id
      name
      description
      uom
      quantity
      unitCost
      duration
      total
      assigneeIds
      workCompleted
      workCompletedAt
      projectId
      taskId
      tenantId
      createdAt
    }
  }
`

export const UPDATE_OFFER = gql`
  mutation UpdateOffer($id: ID!, $projectId: String!, $taskId: String!, $tenantId: String!, $input: UpdateOfferInput!) {
    updateOffer(id: $id, projectId: $projectId, taskId: $taskId, tenantId: $tenantId, input: $input) {
      id
      name
      description
      uom
      quantity
      unitCost
      duration
      total
      assigneeIds
      workCompleted
      workCompletedAt
      updatedAt
    }
  }
`

export const DELETE_OFFER = gql`
  mutation DeleteOffer($id: ID!, $projectId: String!, $taskId: String!, $tenantId: String!) {
    deleteOffer(id: $id, projectId: $projectId, taskId: $taskId, tenantId: $tenantId)
  }
`

// ─── Pricing Runs (agentic reports) ──────────────────────────────────────────

export const GET_PROJECT_PRICING_RUNS = gql`
  query GetProjectPricingRuns($projectId: String!, $tenantId: String!) {
    projectPricingRuns(projectId: $projectId, tenantId: $tenantId) {
      id
      projectId
      tenantId
      report
      agentReport
      toolCallLog
      agentActivityLog
      toolCallsMade
      runAt
      offersSnapshot
    }
  }
`

export const DELETE_PRICING_RUN = gql`
  mutation DeletePricingRun($id: ID!, $projectId: String!, $tenantId: String!) {
    deletePricingRun(id: $id, projectId: $projectId, tenantId: $tenantId)
  }
`

export const DELETE_ALL_PRICING_RUNS_FOR_PROJECT = gql`
  mutation DeleteAllPricingRunsForProject($projectId: String!, $tenantId: String!) {
    deleteAllPricingRunsForProject(projectId: $projectId, tenantId: $tenantId)
  }
`

// ─── Project Email ───────────────────────────────────────────────────────────

export const GET_PROJECT_EMAILS = gql`
  query GetProjectEmails($projectId: String!, $tenantId: String!) {
    projectEmails(projectId: $projectId, tenantId: $tenantId) {
      id
      projectId
      taskId
      offerId
      senderId
      toEmails
      toPhoneNumbers
      deliveryChannels
      subject
      body
      sentAt
    }
  }
`

export const SEND_PROJECT_EMAIL = gql`
  mutation SendProjectEmail($input: SendProjectEmailInput!) {
    sendProjectEmail(input: $input) {
      id
      projectId
      taskId
      offerId
      senderId
      toEmails
      toPhoneNumbers
      deliveryChannels
      subject
      body
      sentAt
    }
  }
`

// ─── Workspace tenant (Settings) ─────────────────────────────────────────────

export const GET_WORKSPACE_TENANTS = gql`
  query WorkspaceTenants($tenantId: String!) {
    tenants(tenantId: $tenantId) {
      id
      tenantId
      organizationName
      phoneNumber
      addressLine1
      city
      country
      laborTimezone
      laborWorkdayStart
      laborWorkdayEnd
    }
  }
`

export const UPDATE_WORKSPACE_TENANT = gql`
  mutation UpdateWorkspaceTenant($id: ID!, $tenantId: String!, $input: UpdateTenantInput!) {
    updateTenant(id: $id, tenantId: $tenantId, input: $input) {
      id
      laborTimezone
      laborWorkdayStart
      laborWorkdayEnd
    }
  }
`

// ─── Weekly labor efficiency ─────────────────────────────────────────────────

export const WEEKLY_LABOR_EFFICIENCY = gql`
  query WeeklyLaborEfficiency(
    $projectId: String!
    $tenantId: String!
    $weekContainingDate: String!
    $weekStartMode: WeekStartMode!
    $assigneeId: String
    $taskId: String
  ) {
    weeklyLaborEfficiency(
      projectId: $projectId
      tenantId: $tenantId
      weekContainingDate: $weekContainingDate
      weekStartMode: $weekStartMode
      assigneeId: $assigneeId
      taskId: $taskId
    ) {
      weekStart
      weekEnd
      weekLabel
      timezone
      laborConfigComplete
      laborConfigWarning
      plannedHours
      actualHours
      laborEfficiencyPercent
      completedOfferLines
      detailRows {
        taskId
        taskName
        offerId
        offerName
        assigneeIds
        plannedHours
        actualHours
        laborEfficiencyPercent
        workCompletedAt
      }
      chartWeeks {
        weekStart
        weekEnd
        weekLabel
        plannedHours
        actualHours
        laborEfficiencyPercent
      }
    }
  }
`
