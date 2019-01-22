/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package com.addteq.confluence.plugin.floorplan;

import net.java.ao.Entity;
import net.java.ao.Preload;

/**
 *
 * @author vikashkumar
 */
//@Preload
public interface AllotAreaDB extends Entity{

    public int      getType();
    public void     setType(int type);
    
    public String   getNote();
    public void     setNote(String note);
    
    public long     getCreated();
    public void     setCreated(long created);
    
    public long     getModified();
    public void     setModified(long modified);
    
    public int      getxCord();
    public void     setxCord(int xCord);
    
    public int      getyCord();
    public void     setyCord(int yCord);
    
    public int      getHeight();
    public void     setHeight(int height);
    
    public int      getWidth();
    public void     setWidth(int width);
    
    public long      getPageId();
    public void     setPageId(long pageId);
    
    public String   getChecksum();
    public void     setChecksum(String checksum);
    
    public long      getUserId();
    public void     setUserId(long userId);
    
    public String    getResourceUrl();
    public void      setResourceUrl(String resourceUrl);
    
    public String    getSeatNo();
    public void      setSeatNo(String seatNo);
       
    public String    getMacroId();
    public void      setMacroId(String macroId);
    
    public int       getViewportwidth();
    public void      setViewportwidth(int viewportwidth);
    
    public int       getAllotedId();
    public void      setAllotedId(int allotedId);
    
    public boolean getShowLabel();
    public void setShowLabel(boolean showLabel);
}
