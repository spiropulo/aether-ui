import { gql } from '@apollo/client/core'

// ─── Catalog (read-only, system-managed) ─────────────────────────────────────

export const GET_PRETRAIN_CATALOG = gql`
  query GetPretrainCatalog($page: PageInput, $search: String) {
    pretrainCatalog(page: $page, search: $search) {
      items {
        id
        title
        fileName
        trainingContent
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

export const GET_PRETRAIN_ENTRY = gql`
  query GetPretrainEntry($id: ID!) {
    pretrainEntry(id: $id) {
      id
      title
      fileName
      trainingContent
      createdAt
      updatedAt
    }
  }
`

// ─── Tenant-level selections ──────────────────────────────────────────────────

export const GET_TENANT_SELECTED_PRETRAIN = gql`
  query GetTenantSelectedPretrain($tenantId: String!) {
    tenantSelectedPretrainData(tenantId: $tenantId) {
      id
      title
      fileName
      trainingContent
    }
  }
`

// ─── Task-level selections ────────────────────────────────────────────────────

export const GET_TASK_SELECTED_PRETRAIN = gql`
  query GetTaskSelectedPretrain($taskId: String!, $tenantId: String!) {
    taskSelectedPretrainData(taskId: $taskId, tenantId: $tenantId) {
      id
      title
      fileName
      trainingContent
    }
  }
`

// ─── Mutations ────────────────────────────────────────────────────────────────

export const SELECT_PRETRAIN_DATA = gql`
  mutation SelectPretrainData($pretrainDataId: ID!, $tenantId: String!) {
    selectPretrainData(pretrainDataId: $pretrainDataId, tenantId: $tenantId) {
      id
      pretrainDataId
      tenantId
    }
  }
`

export const SELECT_PRETRAIN_DATA_FOR_TASK = gql`
  mutation SelectPretrainDataForTask($pretrainDataId: ID!, $taskId: String!, $tenantId: String!) {
    selectPretrainDataForTask(pretrainDataId: $pretrainDataId, taskId: $taskId, tenantId: $tenantId) {
      id
      pretrainDataId
      taskId
      tenantId
    }
  }
`

export const DESELECT_PRETRAIN_DATA = gql`
  mutation DeselectPretrainData($id: ID!, $tenantId: String!) {
    deselectPretrainData(id: $id, tenantId: $tenantId)
  }
`
