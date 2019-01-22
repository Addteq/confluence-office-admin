/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.addteq.confluence.plugin.floorplan;

import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.confluence.user.UserAccessor;
import com.atlassian.confluence.user.actions.ProfilePictureInfo;

import java.util.*;

/**
 *
 * @author Deep Makhecha
 */
public class AllotAreaServiceImpl implements AllotAreaService{    
    
    private final ActiveObjects ao;
    private UserAccessor userAccessor;

    public AllotAreaServiceImpl(ActiveObjects ao, UserAccessor userAccessor) {
        this.ao = ao;
        this.userAccessor= userAccessor;
    }

    /**
     * Depending upon the type this method retrieves the data required by the floorplan or flowdiagram macro on any page
     * @param allotAreaRestModel
     * @param changeInRecords
     * @return 
     */
    @Override
    public List<AllotAreaRestModel> getAllAllotedAreaFromDb(AllotAreaRestModel allotAreaRestModel, boolean changeInRecords) {
        AllotAreaDB[] allotAreaDb;
        
        List<Object> paramsList = new ArrayList<>();
        paramsList.add(allotAreaRestModel.getPageId());

        String sqlQuery = "PAGE_ID = ? ";

        if (!changeInRecords) {
        	sqlQuery += " AND TYPE = ? ";
            paramsList.add(allotAreaRestModel.getType());

        }

        if(!allotAreaRestModel.isShowAllRecords()) {
        	sqlQuery += " AND CHECKSUM = ? ";
        	paramsList.add(allotAreaRestModel.getChecksum());
        }
                
        boolean userLookUp = !Long.toString(allotAreaRestModel.getCreated()).equals("0");
       
        if (userLookUp) {
        	sqlQuery += " AND CREATED = ? ";
        	paramsList.add(allotAreaRestModel.getCreated());
        }
        
        Object[] paramsArray = new Object[paramsList.size()];
        paramsArray = paramsList.toArray(paramsArray);

        allotAreaDb = ao.find(AllotAreaDB.class, sqlQuery, paramsArray);

        
        if (allotAreaDb != null && allotAreaDb.length == 0 && userLookUp) {
            allotAreaDb = ao.find(AllotAreaDB.class, "PAGE_ID = ? ", allotAreaRestModel.getPageId());
        }
        
        
        // UCASE not working in PostgreSQL so sorting this using comparator to avoid sql dependency with any database
        Comparator<AllotAreaDB> noteFieldComparator = new Comparator<AllotAreaDB>() {
            @Override
            public int compare(AllotAreaDB aadb1, AllotAreaDB aadb2) {
                return aadb2.getNote().compareTo(aadb1.getNote());
            }
        };
        Arrays.sort(allotAreaDb, noteFieldComparator);
        List<AllotAreaRestModel> alloteAreaRestModelList = new ArrayList<AllotAreaRestModel>();
        AllotAreaRestModel allottedArea;
        for (AllotAreaDB allotAreaDb1 : allotAreaDb) {
            allottedArea = new AllotAreaRestModel();
            allottedArea.setId(allotAreaDb1.getID());
            allottedArea.setType(allotAreaDb1.getType());
            allottedArea.setX1(allotAreaDb1.getxCord());
            allottedArea.setY1(allotAreaDb1.getyCord());
            allottedArea.setWidth(allotAreaDb1.getWidth());
            allottedArea.setHeight(allotAreaDb1.getHeight());
            allottedArea.setAllotedId(allotAreaDb1.getAllotedId());
            allottedArea.setNote(allotAreaDb1.getNote());
            allottedArea.setShowLabel(allotAreaDb1.getShowLabel());
            allottedArea.setCreated(allotAreaDb1.getCreated());
            allottedArea.setModified(allotAreaDb1.getModified());
            allottedArea.setUserId(allotAreaDb1.getUserId());
            allottedArea.setResourceUrl(allotAreaDb1.getResourceUrl());
            allottedArea.setSeatNo(allotAreaDb1.getSeatNo());
            allottedArea.setViewportwidth(allotAreaDb1.getViewportwidth());
            if (allottedArea.getType() == 0) {
                try {
                    allottedArea.setUserTitle(userAccessor.getUserByName(allotAreaDb1.getNote()).getFullName());
                    ProfilePictureInfo profilePictureInfo = (ProfilePictureInfo) userAccessor.getUserProfilePicture(userAccessor.getUserByName(allotAreaDb1.getNote()));
                    allottedArea.setProfilePicLink(profilePictureInfo.getDownloadPath());
                    /*to test the speed of floor plan image loading. Can be reverted to the previous code in case the difference is not significant.
                     allottedArea.setProfilePicLink("/images/icons/profilepics/default.png");*/
                } catch (Exception e) {
                    e.printStackTrace();
                }
            } else {
                allottedArea.setUserTitle(allotAreaDb1.getNote());
            }
            alloteAreaRestModelList.add(allottedArea);
        }
        return alloteAreaRestModelList;
    }
    
    /**
     * Comparing and finding out which color is the latest used in rooms or resource. 
     * This is done as in AO using functions like MAX or DISTINCT may not be a success for all databases.
     * @param allotAreaRestModel
     * @return 
     */
    @Override  
    public AllotAreaRestModel getMaxAllotedAreaId(AllotAreaRestModel allotAreaRestModel) {
        List<AllotAreaRestModel> getAllAllotedAreaType = getAllAllotedAreaFromDb(allotAreaRestModel, false);
        if (!getAllAllotedAreaType.isEmpty()) {
            Comparator<AllotAreaRestModel> sortByAllotedId = new Comparator<AllotAreaRestModel>() {
                @Override
                public int compare(AllotAreaRestModel o1, AllotAreaRestModel o2) {
                    if (o1.getAllotedId() == o2.getAllotedId()) {
                        return 0;
                    } else if (o1.getAllotedId() > o2.getAllotedId()) {
                        return -1;
                    } else {
                        return 1;
                    }
                }
            };
            Collections.sort(getAllAllotedAreaType, sortByAllotedId);
            return getAllAllotedAreaType.get(0);
        }else{
            allotAreaRestModel.setAllotedId(0);
            return allotAreaRestModel;
        }                            
    }
    
    @Override
    public int setMaxAllotedAreaId(AllotAreaRestModel allotAreaRestModel){        
        int maxAllotedId = -1;
        for (int type = 1; type <= 2; type++) {
            allotAreaRestModel.setType(type);
            AllotAreaRestModel maxAllotedAreaId = getMaxAllotedAreaId(allotAreaRestModel);
            if (maxAllotedAreaId.getAllotedId() > maxAllotedId) {
                maxAllotedId = maxAllotedAreaId.getAllotedId();
            }
        }
        return maxAllotedId;
    }
    
    /**
     * Updating a particular area or a tagged user details.
     */
    public void updateAllotedAreaDB(){
        AllotAreaDB[] allotAreaDB = ao.find(AllotAreaDB.class);
        Map<AllotAreaRestModel, String> uniqueMacroIdWithCheckSum = new HashMap<AllotAreaRestModel, String>();
        for(AllotAreaDB allotedArea : allotAreaDB){
            AllotAreaRestModel allotedAreaRestModel = new AllotAreaRestModel();
            allotedAreaRestModel.setPageId(allotedArea.getPageId());
            allotedAreaRestModel.setChecksum(allotedArea.getChecksum());
            uniqueMacroIdWithCheckSum.put(allotedAreaRestModel, allotedArea.getChecksum());
        }        
        for (Map.Entry pair : uniqueMacroIdWithCheckSum.entrySet()) {
            AllotAreaRestModel allotedAreaRestModel = (AllotAreaRestModel) pair.getKey();
            allotAreaDB = ao.find(AllotAreaDB.class, "PAGE_ID = ? AND CHECKSUM = ? AND TYPE > ?", allotedAreaRestModel.getPageId(), pair.getValue(), 0);
            for (AllotAreaDB allotedArea : allotAreaDB) {
                AllotAreaDB[] allotAreaObj = ao.find(AllotAreaDB.class, "ID = ? ", allotedArea.getID());
                if (allotAreaObj[0].getAllotedId() == 0) {
                    allotedAreaRestModel.setPageId(allotedArea.getPageId());
                    allotedAreaRestModel.setChecksum(allotedArea.getChecksum());              
                    allotAreaObj[0].setAllotedId(setMaxAllotedAreaId(allotedAreaRestModel) + 1);
                    allotAreaObj[0].save();
                }
            }
        }
    }

    /**
     * Deletes redundant the entries with type -1  leaving first one for same macro and updates the first entry
     * with new data (default avatar size to be used from now on).
     * @param allotAreaRestModel
     * @return                      : Return true if everything successful.
     */
    public Boolean updateAvatarSizeEntry(AllotAreaRestModel allotAreaRestModel) {
        AllotAreaDB[] allotAreaObj = ao.find(AllotAreaDB.class, "PAGE_ID = ? AND CHECKSUM = ? AND TYPE = -1 AND MACRO_ID = ?", allotAreaRestModel.getPageId(), allotAreaRestModel.getChecksum(), allotAreaRestModel.getMacroId());
        if (allotAreaObj.length >= 1){
            for (int i = 1; i < allotAreaObj.length; i++) {
                ao.delete(allotAreaObj[i]);
            }
        }
        allotAreaObj[0].setWidth(allotAreaRestModel.getWidth());
        allotAreaObj[0].setHeight(allotAreaRestModel.getHeight());
        allotAreaObj[0].setModified(Calendar.getInstance().getTimeInMillis());
        allotAreaObj[0].save();
        return true;
    }

	@Override
	public void importFloorPlan(AllotAreaRestModel[]  allotAreas, long pageId, String checksum) {

		for(AllotAreaRestModel tag : allotAreas) {
			
			AllotAreaDB allotAreaDbInsert = ao.create(AllotAreaDB.class); // (2)
            allotAreaDbInsert.setType(tag.getType());
            allotAreaDbInsert.setxCord(tag.getX1());
            allotAreaDbInsert.setyCord(tag.getY1());
            allotAreaDbInsert.setHeight(tag.getHeight());
            allotAreaDbInsert.setWidth(tag.getWidth());
            allotAreaDbInsert.setNote(tag.getNote());
            allotAreaDbInsert.setShowLabel(tag.getShowLabel());
            allotAreaDbInsert.setPageId(pageId);
            long timeInMillis = Calendar.getInstance().getTimeInMillis();
            allotAreaDbInsert.setCreated(timeInMillis);
            allotAreaDbInsert.setModified(timeInMillis);
            allotAreaDbInsert.setChecksum(checksum);
            allotAreaDbInsert.setMacroId(tag.getMacroId());
            allotAreaDbInsert.setUserId(tag.getUserId());
            allotAreaDbInsert.setResourceUrl(tag.getResourceUrl());
            allotAreaDbInsert.setSeatNo(tag.getSeatNo());
            allotAreaDbInsert.setAllotedId(tag.getAllotedId());
            allotAreaDbInsert.setViewportwidth(tag.getViewportwidth());
            allotAreaDbInsert.save();
            tag.setConfirm(false);
            
		}
	}
    
    
    
}
