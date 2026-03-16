import { gql } from '@apollo/client/core'

// ─── Projects ────────────────────────────────────────────────────────────────

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
        projectId
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
      projectId
      tenantId
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
      updatedAt
    }
  }
`

export const DELETE_OFFER = gql`
  mutation DeleteOffer($id: ID!, $projectId: String!, $taskId: String!, $tenantId: String!) {
    deleteOffer(id: $id, projectId: $projectId, taskId: $taskId, tenantId: $tenantId)
  }
`

// ─── Project Email ───────────────────────────────────────────────────────────

export const GET_PROJECT_EMAILS = gql`
  query GetProjectEmails($projectId: String!, $tenantId: String!) {
    projectEmails(projectId: $projectId, tenantId: $tenantId) {
      id
      projectId
      taskId
      senderId
      toEmails
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
      senderId
      toEmails
      subject
      body
      sentAt
    }
  }
`
