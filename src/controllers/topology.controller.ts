import {Controller, Get, Route, Security, Tags} from "tsoa";
import {UserRole} from "../models/api/user";
import {TopologyRepository} from "../repositories/topology.repository";
import {APITopologyResponse} from "../types/api/topology_types";

@Route('topology')
@Tags('Topology')
@Security('jwt', [UserRole.ADMIN])
export class TopologyController extends Controller {

  @Get()
  async getTopology(): Promise<APITopologyResponse> {
    return TopologyRepository.findFullTopology();
  }
}

