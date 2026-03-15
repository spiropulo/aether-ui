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
      updatedAt
    }
  }
`

export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!, $projectId: String!, $tenantId: String!) {
    deleteTask(id: $id, projectId: $projectId, tenantId: $tenantId)
  }
`

// ─── Items ───────────────────────────────────────────────────────────────────

export const GET_ITEMS = gql`
  query GetItems($projectId: String!, $taskId: String!, $tenantId: String!, $page: PageInput) {
    items(projectId: $projectId, taskId: $taskId, tenantId: $tenantId, page: $page) {
      items {
        id
        name
        description
        quantity
        cost
        total
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

export const CREATE_ITEM = gql`
  mutation CreateItem($input: CreateItemInput!) {
    createItem(input: $input) {
      id
      name
      description
      quantity
      cost
      total
      projectId
      taskId
      tenantId
      createdAt
    }
  }
`

export const UPDATE_ITEM = gql`
  mutation UpdateItem($id: ID!, $projectId: String!, $taskId: String!, $tenantId: String!, $input: UpdateItemInput!) {
    updateItem(id: $id, projectId: $projectId, taskId: $taskId, tenantId: $tenantId, input: $input) {
      id
      name
      description
      quantity
      cost
      total
      updatedAt
    }
  }
`

export const DELETE_ITEM = gql`
  mutation DeleteItem($id: ID!, $projectId: String!, $taskId: String!, $tenantId: String!) {
    deleteItem(id: $id, projectId: $projectId, taskId: $taskId, tenantId: $tenantId)
  }
`

// ─── Labor ───────────────────────────────────────────────────────────────────

export const GET_LABORS = gql`
  query GetLabors($projectId: String!, $taskId: String!, $tenantId: String!, $page: PageInput) {
    labors(projectId: $projectId, taskId: $taskId, tenantId: $tenantId, page: $page) {
      items {
        id
        name
        description
        time
        cost
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

export const CREATE_LABOR = gql`
  mutation CreateLabor($input: CreateLaborInput!) {
    createLabor(input: $input) {
      id
      name
      description
      time
      cost
      projectId
      taskId
      tenantId
      createdAt
    }
  }
`

export const UPDATE_LABOR = gql`
  mutation UpdateLabor($id: ID!, $projectId: String!, $taskId: String!, $tenantId: String!, $input: UpdateLaborInput!) {
    updateLabor(id: $id, projectId: $projectId, taskId: $taskId, tenantId: $tenantId, input: $input) {
      id
      name
      description
      time
      cost
      updatedAt
    }
  }
`

export const DELETE_LABOR = gql`
  mutation DeleteLabor($id: ID!, $projectId: String!, $taskId: String!, $tenantId: String!) {
    deleteLabor(id: $id, projectId: $projectId, taskId: $taskId, tenantId: $tenantId)
  }
`
