/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.addteq.confluence.plugin.floorplan;

import java.util.List;

/**
 *
 * @author Deep Makhecha
 */
public interface AllotAreaService {
    
    public List<AllotAreaRestModel> getAllAllotedAreaFromDb(AllotAreaRestModel allotAreaRestModel, boolean changeInRecords);
    
    public AllotAreaRestModel getMaxAllotedAreaId(AllotAreaRestModel allotAreaRestModel);
    
    public int setMaxAllotedAreaId(AllotAreaRestModel allotAreaRestModel);
    
    public void updateAllotedAreaDB();
    
    public void importFloorPlan(AllotAreaRestModel[] allotAreas, long pageId, String checksum);

    /**
     * Deletes redundant the entries with type -1  leaving first one for same macro and updates the first entry
     * with new data (default avatar size to be used from now on).
     * @param allotAreaRestModel
     * @return                      : Return true if everything successful.
     */
    public Boolean updateAvatarSizeEntry(AllotAreaRestModel allotAreaRestModel);
}
