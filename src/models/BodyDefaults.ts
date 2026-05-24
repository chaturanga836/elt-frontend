import { BodyType, IFormData, IGraphQL, IRawBody, IRequestBodyState } from "@/types/connection";
import { generateId } from "@/lib/generateId";

export class FormDataDefaults implements IFormData {
  pairs = [{
   uiId: generateId(),
  id: null,
  key: null,
  value: null,
  enabled: true,
  }];
}

export class RawBodyDefaults implements IRawBody {
  content = '';
}

export class GraphQLDefaults implements IGraphQL {
  query = '';
  variables = '{}';
}

export class RequestBodyDefaults implements IRequestBodyState {
  activeType: BodyType = 'none'; 
  bodyData: IFormData | IRawBody | IGraphQL | null = null; // Start with nothing
}

