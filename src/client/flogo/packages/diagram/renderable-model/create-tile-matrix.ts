import { times } from 'lodash';

import { Tile } from '../interfaces/tile';

import { NodeMatrix, TileMatrix } from './matrix';
import { tileFactory } from './tile-factory';

const TILE_PADDING = tileFactory.makePadding();
const TILE_PLACEHOLDER = tileFactory.makePlaceholder();
const fillWithPlaceholders = (fromCount: number, max: number) => times(max - fromCount, () => TILE_PLACEHOLDER);

function makeRowExtensible(rowOfTiles: Tile[], lastNodeId: string, maxRowLength: number) {
  const actionTile = tileFactory.makeInsert(lastNodeId);
  const placeholders = fillWithPlaceholders(rowOfTiles.length + 1, maxRowLength);
  return [...rowOfTiles, actionTile, ...placeholders];
}

// assumes that the rows won't overflow
// and the overflow case should be handled somewhere else.
export function createTileMatrix(nodeMatrix: NodeMatrix, maxRowLength): TileMatrix {
  return nodeMatrix.map(rowOfNodes => {
    if (rowOfNodes.length <= 0) {
      return [];
    }
    const rowOfTiles: Tile[] = rowOfNodes.map(node => node ? tileFactory.makeTask(node) : TILE_PADDING);
    const lastNode = rowOfNodes[rowOfNodes.length - 1];
    const isInsertAllowed = lastNode.capabilities.canHaveChildren;
    if (isInsertAllowed && rowOfTiles.length < maxRowLength) {
      return makeRowExtensible(rowOfTiles, lastNode.id, maxRowLength);
    }
    return rowOfTiles;
  });
}
